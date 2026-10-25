import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Sliders,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio?: number; // largura / altura (ex: 16/10 = 1.6)
  title?: string;
  onClose: () => void;
  onSave: (croppedBase64: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  aspectRatio = 16 / 10,
  title = 'Ajustar Enquadramento da Foto',
  onClose,
  onSave,
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Resetar ao abrir
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Arraste com Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Arraste com Touch (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Presets rápidos de posicionamento
  const applyPreset = (preset: 'center' | 'top' | 'bottom') => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const boxWidth = container.clientWidth;
    const boxHeight = container.clientHeight;
    const baseScale = Math.max(boxWidth / img.naturalWidth, boxHeight / img.naturalHeight);
    const renderedHeight = img.naturalHeight * baseScale * zoom;
    const maxOffsetY = Math.max(0, (renderedHeight - boxHeight) / 2);

    if (preset === 'center') {
      setOffset({ x: 0, y: 0 });
    } else if (preset === 'top') {
      setOffset({ x: 0, y: maxOffsetY });
    } else if (preset === 'bottom') {
      setOffset({ x: 0, y: -maxOffsetY });
    }
  };

  // Gerar imagem final cortada via Canvas
  const handleSaveCrop = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const boxWidth = container.clientWidth;
    const boxHeight = container.clientHeight;

    // Resolução de exportação de alta qualidade
    const targetWidth = 800;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo limpo
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const baseScale = Math.max(boxWidth / img.naturalWidth, boxHeight / img.naturalHeight);
    const currentScale = baseScale * zoom;
    const renderedWidth = img.naturalWidth * currentScale;
    const renderedHeight = img.naturalHeight * currentScale;

    // Fator de escala do preview para o canvas final
    const factor = targetWidth / boxWidth;

    const drawWidth = renderedWidth * factor;
    const drawHeight = renderedHeight * factor;
    const drawX = ((boxWidth - renderedWidth) / 2 + offset.x) * factor;
    const drawY = ((boxHeight - renderedHeight) / 2 + offset.y) * factor;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    onSave(croppedBase64);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-border shadow-elevated overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">
                {title}
              </h3>
              <p className="text-[11px] text-foreground-muted">
                Arraste a foto e use o zoom para enquadrar a melhor área
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-foreground-muted hover:text-foreground rounded-lg hover:bg-muted transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport de Enquadramento */}
        <div className="p-5 flex-1 flex flex-col items-center justify-center overflow-hidden bg-background/50">
          <div
            ref={containerRef}
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-elevated border-2 border-accent/40 select-none cursor-grab active:cursor-grabbing bg-slate-900"
            style={{
              aspectRatio: `${aspectRatio}`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Grade de enquadramento (Regra dos terços) */}
            <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-white/10">
              <div className="border-r border-b border-white/15"></div>
              <div className="border-r border-b border-white/15"></div>
              <div className="border-b border-white/15"></div>
              <div className="border-r border-b border-white/15"></div>
              <div className="border-r border-b border-white/15"></div>
              <div className="border-b border-white/15"></div>
              <div className="border-r border-white/15"></div>
              <div className="border-r border-white/15"></div>
              <div></div>
            </div>

            {/* Imagem arrastável e com zoom */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Ajuste"
              crossOrigin="anonymous"
              onLoad={() => setImgLoaded(true)}
              className="absolute pointer-events-none transition-transform duration-75 max-w-none"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Dica visual de arrastar */}
            <div className="absolute bottom-2.5 right-2.5 z-10 px-2 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white/90 font-medium flex items-center gap-1 pointer-events-none">
              <Move size={11} />
              <span>Arraste para mover</span>
            </div>
          </div>
        </div>

        {/* Controles: Zoom & Presets */}
        <div className="px-5 py-3.5 border-t border-border bg-surface-2/40 space-y-3 text-xs">
          {/* Controle de Zoom */}
          <div className="flex items-center gap-3">
            <span className="text-foreground-muted font-semibold text-[11px] shrink-0 flex items-center gap-1.5">
              <ZoomIn size={14} className="text-accent" />
              Zoom:
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
              className="p-1 rounded-md border border-border bg-surface text-foreground-muted hover:text-foreground cursor-pointer"
              title="Reduzir Zoom"
            >
              <ZoomOut size={13} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-accent cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
              className="p-1 rounded-md border border-border bg-surface text-foreground-muted hover:text-foreground cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn size={13} />
            </button>
            <span className="font-mono text-foreground font-semibold text-[11px] w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Atalhos de Posição Rápida */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-foreground-muted font-semibold text-[11px]">
              Posicionamento rápido:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('top')}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-muted text-foreground text-[11px] font-medium transition cursor-pointer"
              >
                Topo
              </button>
              <button
                type="button"
                onClick={() => applyPreset('center')}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-muted text-foreground text-[11px] font-medium transition cursor-pointer"
              >
                Centro
              </button>
              <button
                type="button"
                onClick={() => applyPreset('bottom')}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-muted text-foreground text-[11px] font-medium transition cursor-pointer"
              >
                Base
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-muted text-foreground-subtle hover:text-foreground text-[11px] font-medium transition cursor-pointer"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>

        {/* Footer com Botões de Ação */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-xs px-4 py-2 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={!imgLoaded}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check size={14} />
            <span>Aplicar Enquadramento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
