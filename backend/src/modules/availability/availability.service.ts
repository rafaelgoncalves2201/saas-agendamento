import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateBlockedTimeDto,
  QuerySlotsDto,
  SetAvailabilityDto,
} from './dto/availability.dto';
import {
  addMinutes,
  format,
  isAfter,
  isBefore,
  isEqual,
  parse,
  set,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailabilities(companyId: string, professionalId?: string) {
    return this.prisma.availability.findMany({
      where: {
        companyId,
        professionalId: professionalId || null,
      },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async setAvailabilities(companyId: string, dto: SetAvailabilityDto) {
    const profId = dto.professionalId || null;

    return this.prisma.$transaction(async (tx) => {
      // Remove configurações anteriores para a mesma abrangência
      await tx.availability.deleteMany({
        where: {
          companyId,
          professionalId: profId,
        },
      });

      // Cria novas regras
      if (dto.availabilities && dto.availabilities.length > 0) {
        await tx.availability.createMany({
          data: dto.availabilities.map((item) => ({
            companyId,
            professionalId: profId,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            breakStart: item.breakStart || null,
            breakEnd: item.breakEnd || null,
            isActive: item.isActive,
          })),
        });
      }

      return tx.availability.findMany({
        where: { companyId, professionalId: profId },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }

  async createBlockedTime(companyId: string, dto: CreateBlockedTimeDto) {
    const start = new Date(dto.startDateTime);
    const end = new Date(dto.endDateTime);

    if (start >= end) {
      throw new BadRequestException('A data/hora inicial deve ser anterior à final');
    }

    return this.prisma.blockedTime.create({
      data: {
        companyId,
        professionalId: dto.professionalId || null,
        startDateTime: start,
        endDateTime: end,
        reason: dto.reason || null,
      },
    });
  }

  async listBlockedTimes(companyId: string, professionalId?: string) {
    return this.prisma.blockedTime.findMany({
      where: {
        companyId,
        ...(professionalId && {
          OR: [{ professionalId }, { professionalId: null }],
        }),
      },
      orderBy: { startDateTime: 'asc' },
    });
  }

  async deleteBlockedTime(companyId: string, id: string) {
    const blocked = await this.prisma.blockedTime.findFirst({
      where: { id, companyId },
    });
    if (!blocked) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return this.prisma.blockedTime.delete({
      where: { id },
    });
  }

  // =========================================================================
  // MOTOR DE CÁLCULO DE SLOTS DISPONÍVEIS
  // =========================================================================
  async calculateAvailableSlots(companyId: string, query: QuerySlotsDto) {
    // 1. Validar serviço e duração
    const service = await this.prisma.service.findFirst({
      where: { id: query.serviceId, companyId, isActive: true },
    });
    if (!service) {
      throw theoryNotFound('Serviço não encontrado ou inativo');
    }

    // 2. Validar profissional
    const professional = await this.prisma.professional.findFirst({
      where: { id: query.professionalId, companyId, isActive: true },
    });
    if (!professional) {
      throw theoryNotFound('Profissional não encontrado ou inativo');
    }

    // 3. Obter configurações da empresa (timezone e aviso prévio)
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    const settings = (company?.settings as Record<string, any>) || {};
    const timezone = settings.timezone || 'America/Sao_Paulo';
    const minNoticeMinutes = settings.minBookingNoticeMinutes || 60;

    // 4. Determinar o dia da semana na timezone da empresa
    // A data vem como YYYY-MM-DD
    const dateParts = query.date.split('-').map(Number);
    if (dateParts.length !== 3) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }
    const [year, month, day] = dateParts;

    // Criar um meio-dia de referência na data desejada
    const referenceDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = referenceDate.getUTCDay(); // 0 a 6

    // 5. Buscar disponibilidades do profissional (ou herdadas da empresa)
    let availabilities = await this.prisma.availability.findMany({
      where: {
        companyId,
        professionalId: professional.id,
        dayOfWeek,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Se profissional não tiver horário customizado, busca o horário geral da empresa
    if (availabilities.length === 0) {
      availabilities = await this.prisma.availability.findMany({
        where: {
          companyId,
          professionalId: null,
          dayOfWeek,
          isActive: true,
        },
        orderBy: { startTime: 'asc' },
      });
    }

    // Se não há disponibilidade para este dia, retorna lista vazia
    if (availabilities.length === 0) {
      return {
        date: query.date,
        dayOfWeek,
        availableSlots: [],
        message: 'Profissional ou estabelecimento não atende nesta data',
      };
    }

    // 6. Converter horários de início e fim para timestamps UTC baseados na timezone da empresa
    const parseTimeToDate = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      // Cria a data no timezone da empresa e converte para UTC
      const dateLocal = new Date(year, month - 1, day, h, m, 0);
      return fromZonedTime(dateLocal, timezone);
    };

    // 7. Liberar reservas pendentes expiradas (mais de 15 minutos sem pagamento)
    const expirationLimit = new Date(Date.now() - 15 * 60 * 1000);
    await this.prisma.appointment.updateMany({
      where: {
        companyId,
        status: 'PENDING_PAYMENT',
        paidAt: null,
        createdAt: { lt: expirationLimit },
      },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Tempo de pagamento do Mercado Pago expirado (15 minutos)',
        cancelledAt: new Date(),
      },
    });

    const dayStartUtc = parseTimeToDate('00:00');
    const dayEndUtc = parseTimeToDate('23:59');

    const blockedTimes = await this.prisma.blockedTime.findMany({
      where: {
        companyId,
        OR: [
          { professionalId: professional.id },
          { professionalId: null },
        ],
        startDateTime: { lt: dayEndUtc },
        endDateTime: { gt: dayStartUtc },
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        companyId,
        professionalId: professional.id,
        status: { not: 'CANCELLED' },
        startDateTime: { lt: dayEndUtc },
        endDateTime: { gt: dayStartUtc },
      },
    });

    // 8. Gerar slots candidatos com turnos fechados
    // Para serviços profissionais (>= 45 min), o passo deve ser a própria duração do serviço
    // para preencher o turno em blocos fechados sem fragmentar horários (ex: 13:45, 14:15).
    const duration = service.durationMinutes;
    const stepMinutes = duration >= 45 ? duration : Math.max(15, duration);
    const slots: { time: string; endTime: string; label: string; duration: number; start: string; end: string }[] = [];
    const addedTimeSet = new Set<string>();

    const now = new Date();
    const minBookingTime = addMinutes(now, minNoticeMinutes);

    for (const avail of availabilities) {
      const workStart = parseTimeToDate(avail.startTime);
      const workEnd = parseTimeToDate(avail.endTime);

      let breakStart: Date | null = null;
      let breakEnd: Date | null = null;
      if (avail.breakStart && avail.breakEnd) {
        breakStart = parseTimeToDate(avail.breakStart);
        breakEnd = parseTimeToDate(avail.breakEnd);
      }

      let current = new Date(workStart.getTime());

      while (true) {
        const slotEnd = addMinutes(current, duration);

        // Se o agendamento ultrapassar o fim deste turno, encerra o turno
        if (isAfter(slotEnd, workEnd)) {
          break;
        }

        // Validar se o horário está no futuro e respeita a antecedência mínima
        const isInFutureWithNotice = isAfter(current, minBookingTime);

        if (isInFutureWithNotice) {
          // Validar sobreposição com intervalo (break)
          let overlapsBreak = false;
          if (breakStart && breakEnd) {
            if (isBefore(current, breakEnd) && isAfter(slotEnd, breakStart)) {
              overlapsBreak = true;
            }
          }

          // Validar sobreposição com bloqueios
          let overlapsBlocked = false;
          if (!overlapsBreak) {
            for (const b of blockedTimes) {
              if (isBefore(current, b.endDateTime) && isAfter(slotEnd, b.startDateTime)) {
                overlapsBlocked = true;
                break;
              }
            }
          }

          // Validar sobreposição com outros agendamentos
          let conflictingApp: any = null;
          if (!overlapsBreak && !overlapsBlocked) {
            for (const a of appointments) {
              if (isBefore(current, a.endDateTime) && isAfter(slotEnd, a.startDateTime)) {
                conflictingApp = a;
                break;
              }
            }
          }

          if (!overlapsBreak && !overlapsBlocked && !conflictingApp) {
            const localTime = toZonedTime(current, timezone);
            const localEndTime = toZonedTime(slotEnd, timezone);
            const timeFormatted = format(localTime, 'HH:mm');
            const endFormatted = format(localEndTime, 'HH:mm');

            if (!addedTimeSet.has(timeFormatted)) {
              addedTimeSet.add(timeFormatted);
              slots.push({
                time: timeFormatted,
                endTime: endFormatted,
                label: `${timeFormatted} às ${endFormatted}`,
                duration,
                start: current.toISOString(),
                end: slotEnd.toISOString(),
              });
            }
            current = addMinutes(current, stepMinutes);
          } else if (conflictingApp) {
            // Se conflitou com um agendamento existente, avança diretamente para o fim dele
            current = new Date(conflictingApp.endDateTime.getTime());
          } else {
            current = addMinutes(current, 15);
          }
        } else {
          current = addMinutes(current, stepMinutes);
        }
      }
    }

    slots.sort((a, b) => a.time.localeCompare(b.time));

    return {
      date: query.date,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
      },
      professional: {
        id: professional.id,
        name: professional.name,
      },
      timezone,
      availableSlots: slots,
    };
  }
}

function theoryNotFound(msg: string) {
  return new NotFoundException(msg);
}

