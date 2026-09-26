import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Aumentar o limite do body-parser para 50MB (upload de fotos, capas e logos em Base64)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));


  // Prefixo global da API
  app.setGlobalPrefix('api');

  // CORS
  const allowedOrigins = process.env.APP_URL
    ? process.env.APP_URL.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'asaas-access-token'],
  });

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('SaaS Agendamento API')
    .setDescription('Documentação da API do SaaS de Agendamento Online Multi-tenant com Assinaturas e WhatsApp')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT retornado no login',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SaaS Agendamento - API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Aplicação rodando em: http://localhost:${port}/api`);
  logger.log(`📚 Swagger Docs disponível em: http://localhost:${port}/api/docs`);
}
bootstrap();
