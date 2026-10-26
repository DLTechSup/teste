import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types';
import { formatBRL, getAllPendenciasSummary } from './productUtils';

/**
 * Converte com segurança uma imagem URL em base64 com timeout e fallback silencioso
 */
async function getImageBase64(url?: string): Promise<string | null> {
  if (!url || !url.trim()) return null;
  if (url.startsWith('data:image/')) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    const timer = setTimeout(() => {
      resolve(null);
    }, 1200);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.naturalWidth || 60, 120);
        canvas.height = Math.min(img.naturalHeight || 60, 120);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
          return;
        }
      } catch {
        // Ignora CORS / canvas security
      }
      resolve(null);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * 1. GERAÇÃO E DOWNLOAD DO RELATÓRIO GERAL / HISTÓRICO EM PDF
 */
export async function downloadProductsReportPDF({
  products,
  brandFilter,
}: {
  products: Product[];
  brandFilter: string;
}): Promise<void> {
  // Filtra produtos conforme marca
  const filtered = products.filter((p) => {
    const hasCode = Boolean(p.submittedCode);
    const isCompletedOrReceived = p.status === 'completed' || p.status === 'code_received';
    if (!hasCode && !isCompletedOrReceived) return false;
    if (brandFilter !== 'all' && p.brand.toLowerCase() !== brandFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cabeçalho institucional
  doc.setFillColor(30, 27, 75); // Indigo 950
  doc.rect(0, 0, 297, 26, 'F');

  // Carrega logo oficial
  const logoB64 = await getImageBase64('/assets/aistudio/image_4442907a.png');
  let titleX = 14;
  if (logoB64) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 3.5, 26, 19, 2, 2, 'F');
      doc.addImage(logoB64, 'PNG', 13, 4.5, 24, 17);
      titleX = 42;
    } catch {
      titleX = 14;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CALÇADOS 24H  •  RELATÓRIO DE HISTÓRICO & CÓDIGOS RECEBIDOS', titleX, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Emissão: ${currentDate}   |   Filtro: ${brandFilter !== 'all' ? `Marca ${brandFilter}` : 'Todas as Marcas'}   |   Total: ${filtered.length} modelo(s)`,
    titleX,
    18
  );

  // Pré-carrega miniaturas das primeiras 50 imagens
  const imageMap = new Map<string, string>();
  const toLoad = filtered.slice(0, 50);
  await Promise.all(
    toLoad.map(async (p) => {
      if (p.photoUrl) {
        const b64 = await getImageBase64(p.photoUrl);
        if (b64) imageMap.set(p.id, b64);
      }
    })
  );

  // Monta tabela com autoTable
  const tableRows = filtered.map((p, index) => {
    const statusAtacadoText = p.sentToAtacado ? 'OK - Enviado' : 'PENDENTE (Falta Atacado)';
    const statusSiteText = p.sentToSite ? 'Enviado ao Site' : 'Pendente';
    const statusFinal = p.status === 'completed' ? 'Finalizado' : 'Código Recebido';
    const dateFormatted = new Date(p.completedAt || p.submittedAt || p.createdAt).toLocaleDateString('pt-BR');

    return [
      String(index + 1),
      '', // espaço reservado para thumbnail
      p.brand.toUpperCase(),
      p.reference,
      formatBRL(p.price),
      p.submittedCode || 'Sem Código',
      statusFinal,
      statusSiteText,
      statusAtacadoText,
      dateFormatted,
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [
      [
        '#',
        'Foto',
        'Marca',
        'Referência',
        'Valor no Bling',
        'Código das Fotos',
        'Status',
        'Site',
        'Atacado',
        'Data',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [67, 56, 202], // Indigo 700
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, minCellHeight: 16, halign: 'center' },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 30, fontStyle: 'bold' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 38, fontStyle: 'bold' },
      6: { cellWidth: 28, halign: 'center' },
      7: { cellWidth: 26, halign: 'center' },
      8: { cellWidth: 38, halign: 'center' },
      9: { cellWidth: 23, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Se for a coluna da foto (índice 1) e estiver no corpo da tabela
      if (data.section === 'body' && data.column.index === 1) {
        const item = filtered[data.row.index];
        if (item) {
          const b64 = imageMap.get(item.id);
          if (b64) {
            try {
              doc.addImage(
                b64,
                'JPEG',
                data.cell.x + 2,
                data.cell.y + 1.5,
                14,
                11
              );
            } catch {
              // Fallback silencioso
            }
          }
        }
      }
    },
    didParseCell: (data) => {
      // Destaque visual para atacado pendente
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'PENDENTE (Falta Atacado)') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber 700
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald 600
        }
      }
    },
  });

  // Salva o arquivo PDF diretamente no navegador
  const cleanBrand = brandFilter !== 'all' ? brandFilter.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'todas_marcas';
  const cleanDate = new Date().toISOString().slice(0, 10);
  const fileName = `relatorio_calcados_${cleanBrand}_${cleanDate}.pdf`;
  doc.save(fileName);
}

/**
 * 2. GERAÇÃO E DOWNLOAD DO RELATÓRIO DE PENDÊNCIAS EM PDF (PARA ENVIAR À LOJA)
 */
export async function downloadPendenciasReportPDF({
  products,
  brandFilter,
  typeFilter,
}: {
  products: Product[];
  brandFilter: string;
  typeFilter: 'all' | 'withCode' | 'noCode';
}): Promise<void> {
  const summary = getAllPendenciasSummary(products);

  const filteredItems = summary.all.filter((p) => {
    if (brandFilter !== 'all' && p.brand.toLowerCase() !== brandFilter.toLowerCase()) {
      return false;
    }
    const hasCode = Boolean(p.submittedCode && p.submittedCode.trim().length > 0);
    if (typeFilter === 'withCode' && !hasCode) return false;
    if (typeFilter === 'noCode' && hasCode) return false;
    return true;
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Barra de topo de Alerta Crítico (Vermelho / Bordô)
  doc.setFillColor(159, 18, 57); // Rose 900
  doc.rect(0, 0, 297, 26, 'F');

  // Carrega logo oficial
  const logoB64 = await getImageBase64('/assets/aistudio/image_4442907a.png');
  let titleX = 14;
  if (logoB64) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 3.5, 26, 19, 2, 2, 'F');
      doc.addImage(logoB64, 'PNG', 13, 4.5, 24, 17);
      titleX = 42;
    } catch {
      titleX = 14;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CALÇADOS 24H  •  RELATÓRIO OFICIAL DE PENDÊNCIAS (ENVIO À LOJA / FILIAIS)', titleX, 10);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const typeLabel =
    typeFilter === 'withCode'
      ? 'Apenas Com Código (Faltam Fotos)'
      : typeFilter === 'noCode'
      ? 'Apenas Sem Código e Sem Fotos (Falta Tudo)'
      : 'Todas as Pendências';

  doc.text(
    `Emissão: ${currentDate}   |   Filtro: ${brandFilter !== 'all' ? `Marca ${brandFilter}` : 'Todas as Marcas'} (${typeLabel})   |   Total: ${filteredItems.length} pendência(s)`,
    titleX,
    16
  );

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Favor providenciar com prioridade as fotos e códigos listados abaixo para publicação imediata no e-commerce.',
    titleX,
    22
  );

  // Pré-carrega miniaturas
  const imageMap = new Map<string, string>();
  const toLoad = filteredItems.slice(0, 50);
  await Promise.all(
    toLoad.map(async (p) => {
      if (p.photoUrl) {
        const b64 = await getImageBase64(p.photoUrl);
        if (b64) imageMap.set(p.id, b64);
      }
    })
  );

  const tableRows = filteredItems.map((p, index) => {
    const hasCode = Boolean(p.submittedCode && p.submittedCode.trim().length > 0);
    const tipoStatus = hasCode
      ? 'Já tem o código, mas faltam as fotos'
      : 'FALTA O CÓDIGO E FALTA AS FOTOS';

    const codigoText = hasCode ? p.submittedCode! : 'CÓDIGO NÃO CADASTRADO';
    const providenciarText = [
      p.observation ? `Admin: ${p.observation}` : '',
      p.storeObservation ? `Loja: ${p.storeObservation}` : '',
      !hasCode ? 'URGENTE: Digitar código de barras físico da caixa.' : '',
      !p.photoUrl || p.photoStatus !== 'Ja tenho as fotos' ? 'URGENTE: Tirar e enviar fotos de sola, detalhes e catálogo.' : '',
    ]
      .filter(Boolean)
      .join(' | ') || 'Providenciar fotos e conferência física do calçado.';

    return [
      String(index + 1),
      '', // espaço para miniatura da foto
      p.brand.toUpperCase(),
      p.reference,
      formatBRL(p.price),
      tipoStatus,
      codigoText,
      providenciarText,
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [
      [
        '#',
        'Foto Ref',
        'Marca',
        'Referência',
        'Valor no Bling',
        'Qual o Tipo da Pendência? (O que está faltando)',
        'Código de Barras',
        'O que a Loja Precisa Providenciar / Observações',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [190, 18, 60], // Rose 700
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, minCellHeight: 16, halign: 'center' },
      2: { cellWidth: 30, fontStyle: 'bold' },
      3: { cellWidth: 30, fontStyle: 'bold' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 54, fontStyle: 'bold' },
      6: { cellWidth: 35, fontStyle: 'bold', halign: 'center' },
      7: { cellWidth: 62, fontSize: 7.5 },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const item = filteredItems[data.row.index];
        if (item) {
          const b64 = imageMap.get(item.id);
          if (b64) {
            try {
              doc.addImage(
                b64,
                'JPEG',
                data.cell.x + 2,
                data.cell.y + 1.5,
                14,
                11
              );
            } catch {
              // Fallback silencioso
            }
          }
        }
      }
    },
    didParseCell: (data) => {
      // Destaque visual para o tipo de pendência
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'FALTA O CÓDIGO E FALTA AS FOTOS') {
          data.cell.styles.textColor = [190, 18, 60]; // Rose 700
          data.cell.styles.fillColor = [255, 241, 242]; // Rose 50
        } else {
          data.cell.styles.textColor = [180, 83, 9]; // Amber 700
          data.cell.styles.fillColor = [254, 252, 232]; // Amber 50
        }
      }
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'CÓDIGO NÃO CADASTRADO') {
          data.cell.styles.textColor = [190, 18, 60];
        }
      }
    },
  });

  const cleanBrand = brandFilter !== 'all' ? brandFilter.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'todas_marcas';
  const cleanDate = new Date().toISOString().slice(0, 10);
  const fileName = `relatorio_pendencias_${cleanBrand}_${cleanDate}.pdf`;
  doc.save(fileName);
}
