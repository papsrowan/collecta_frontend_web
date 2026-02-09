import { jsPDF } from 'jspdf';
import { Retrait } from '../services/retraitService';

export function generateBicecReceiptPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Couleurs UBA (rouge et blanc)
  const ubaRed = [200, 16, 46]; // Rouge UBA
  const blueColor = [0, 102, 204]; // Bleu pour le tampon

  // En-tête avec logo UBA (simulation)
  // Zone logo en haut à droite
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(pageWidth - 50, 5, 45, 15, 'F');
  
  // Texte UBA
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('UBA', pageWidth - 27, 11);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Africa\'s global bank', pageWidth - 27, 15);
  
  // "Exemplaire client / Customer copy"
  doc.setFontSize(8);
  doc.text('Exemplaire client / Customer copy', pageWidth - 27, 19);

  // Informations client à gauche
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Institut Universitaire de Technologie de Douala', margin, 18);

  yPos = 30;

  // Colonne gauche - Détails de l'opération
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 10;
  let currentY = yPos;

  // OPERATION
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(leftColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('OPERATION:', leftColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(leftColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('VERSEMENT ESPECES', leftColX + 37, currentY + 4);
  currentY += 8;

  // DATE
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(leftColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', leftColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(leftColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateStr} à ${timeStr}`, leftColX + 37, currentY + 4);
  currentY += 8;

  // NUMERO DE COMPTE
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(leftColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('NUMERO DE COMPTE:', leftColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(leftColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('72355712001-60', leftColX + 37, currentY + 4);
  currentY += 8;

  // NOM DU REMETTANT
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(leftColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('NOM DU REMETTANT:', leftColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(leftColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('MM', leftColX + 37, currentY + 4);
  currentY += 8;

  // CNI/PASSEPORT N°
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(leftColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('CNI/PASSEPORT N°:', leftColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(leftColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('20190011629110551', leftColX + 37, currentY + 4);
  currentY += 8;

  // GESTIONNAIRE
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(leftColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GESTIONNAIRE:', leftColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(leftColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('129', leftColX + 37, currentY + 4);

  // Colonne droite - Agence et transaction
  currentY = yPos;
  const rightColWidth = 80;

  // AGENCE TRANS
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(rightColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('AGENCE TRANS:', rightColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(rightColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('06812 DOUALA ANGE RAPHAEL', rightColX + 37, currentY + 4);
  currentY += 8;

  // NUMERO D'ORDRE
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(rightColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('NUMERO D\'ORDRE:', rightColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(rightColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('391682', rightColX + 37, currentY + 4);
  currentY += 8;

  // AGENCE COMPTE
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(rightColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('AGENCE COMPTE:', rightColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(rightColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('06812 DOUALA ANGE RAPHAEL', rightColX + 37, currentY + 4);
  currentY += 8;

  // CAISSE
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(rightColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('CAISSE:', rightColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(rightColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('111 CAISSE ESPECES XAF', rightColX + 37, currentY + 4);
  currentY += 8;

  // GUICHETIER
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(rightColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GUICHETIER:', rightColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(rightColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('4330', rightColX + 37, currentY + 4);
  currentY += 8;

  // MOTIF
  doc.setFillColor(ubaRed[0], ubaRed[1], ubaRed[2]);
  doc.rect(rightColX, currentY, 35, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('MOTIF:', rightColX + 1, currentY + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(rightColX + 35, currentY, 45, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('', rightColX + 37, currentY + 4);

  currentY += 12;

  // Tableau LIBELLE ET REFERENCE
  const tableStartY = currentY;
  const tableWidth = pageWidth - margin * 2;
  const col1Width = tableWidth * 0.4; // Nombre
  const col2Width = tableWidth * 0.3; // Valeur
  const col3Width = tableWidth * 0.3; // Montant

  // En-tête du tableau
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, currentY, tableWidth, 8, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, tableWidth, 8, 'S');
  
  // Ligne verticale
  doc.line(margin + col1Width, currentY, margin + col1Width, currentY + 8);
  doc.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('LIBELLE ET REFERENCE', margin + 2, currentY + 5);
  doc.text('Nombre', margin + col1Width + 2, currentY + 5);
  doc.text('Valeur', margin + col1Width + col2Width + 2, currentY + 5);
  doc.text('Montant', margin + col1Width + col2Width + col3Width - 20, currentY + 5);

  currentY += 8;

  // Ligne de données
  doc.setFont('helvetica', 'normal');
  doc.rect(margin, currentY, tableWidth, 8, 'S');
  doc.line(margin + col1Width, currentY, margin + col1Width, currentY + 8);
  doc.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + 8);
  
  doc.text('30', margin + col1Width + 2, currentY + 5);
  doc.text('5.000', margin + col1Width + col2Width + 2, currentY + 5);
  doc.text('150.000', margin + col1Width + col2Width + col3Width - 20, currentY + 5);

  currentY += 8;

  // Ligne TOTAL
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, currentY, tableWidth, 8, 'S');
  doc.line(margin + col1Width, currentY, margin + col1Width, currentY + 8);
  doc.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + 8);
  
  doc.text('TOTAL', margin + 2, currentY + 5);
  doc.text('150.000', margin + col1Width + col2Width + col3Width - 20, currentY + 5);

  currentY += 15;

  // Section DEBIT, CREDIT, DATE VALEUR
  let summaryY = currentY;
  const summaryColWidth = (pageWidth - margin * 2) / 3;

  // En-têtes
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DEBIT', margin, summaryY);
  doc.text('CREDIT', margin + summaryColWidth, summaryY);
  doc.text('DATE VALEUR', margin + summaryColWidth * 2, summaryY);

  summaryY += 6;
  
  // Valeurs
  doc.setFont('helvetica', 'normal');
  doc.text('', margin, summaryY);
  doc.text('150.000', margin + summaryColWidth, summaryY);
  
  // Date valeur (1 mois après la date de transaction)
  const valeurDate = new Date(now);
  valeurDate.setMonth(valeurDate.getMonth() + 1);
  const valeurDateStr = valeurDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  doc.text(valeurDateStr, margin + summaryColWidth * 2, summaryY);

  summaryY += 6;
  
  // Texte "Nous portons au crédit..."
  doc.setFontSize(8);
  doc.text('Nous portons au crédit du compte N° 72355712001-60 XAF', margin, summaryY);

  summaryY += 10;

  // Tampon RECU (simulation avec rectangle bleu)
  const stampX = margin + summaryColWidth;
  const stampY = summaryY - 8;
  const stampWidth = 40;
  const stampHeight = 25;

  doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.rect(stampX, stampY, stampWidth, stampHeight, 'F');
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(1);
  doc.rect(stampX, stampY, stampWidth, stampHeight, 'S');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECU', stampX + stampWidth / 2, stampY + 6, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const stampDate = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
  doc.text(stampDate, stampX + stampWidth / 2, stampY + 12, { align: 'center' });
  doc.text('UBA ANGE RAPHAEL', stampX + stampWidth / 2, stampY + 18, { align: 'center' });
  doc.text('R2', stampX + stampWidth / 2, stampY + 22, { align: 'center' });

  summaryY += 25;

  // Signatures
  const signatureY = pageHeight - 50;
  const signatureWidth = 70;

  // GUICHETIER
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.line(margin, signatureY, margin + signatureWidth, signatureY);
  doc.text('GUICHETIER', margin + signatureWidth / 2, signatureY - 2, { align: 'center' });

  // CLIENT
  doc.line(pageWidth - margin - signatureWidth, signatureY, pageWidth - margin, signatureY);
  doc.text('CLIENT', pageWidth - margin - signatureWidth / 2, signatureY - 2, { align: 'center' });

  // Informations de la banque en bas
  const footerY = pageHeight - 25;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('United Bank for Africa - Africa\'s Global Bank', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Agence: 06812 DOUALA ANGE RAPHAEL', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text('Douala, Cameroun', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text('Adresse Email: info@ubagroup.com', pageWidth / 2, footerY + 12, { align: 'center' });
  doc.text('Site Web: www.ubagroup.com', pageWidth / 2, footerY + 16, { align: 'center' });

  // GUI-17 en bas à gauche
  doc.setFontSize(8);
  doc.text('GUI-17', margin, pageHeight - 5);

  // Télécharger le PDF
  const fileName = `recu_uba_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function generateRetraitReceiptPDF(retrait: Retrait): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // En-tête
  doc.setFillColor(62, 184, 129); // #3EB881
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('COLLECTE JOURNALIÈRE', pageWidth / 2, 20, { align: 'center' });
  
  // Sous-titre
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Reçu de Retrait', pageWidth / 2, 28, { align: 'center' });

  yPos = 50;

  // Informations du retrait
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const infoSpacing = 8;
  let currentY = yPos;

  // Numéro de retrait
  doc.setFont('helvetica', 'bold');
  doc.text('Numéro de retrait:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${retrait.idRetrait}`, pageWidth - margin - 30, currentY);
  currentY += infoSpacing;

  // Date
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date(retrait.dateRetrait).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(dateStr, pageWidth - margin - 30, currentY);
  currentY += infoSpacing;

  // Numéro de compte
  doc.setFont('helvetica', 'bold');
  doc.text('Numéro de compte:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(retrait.compte.numeroCompte, pageWidth - margin - 30, currentY);
  currentY += infoSpacing;

  // Commerçant
  doc.setFont('helvetica', 'bold');
  doc.text('Commerçant:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  const nomCommercant = retrait.compte.commerçant.nomComplet;
  const maxWidth = pageWidth - margin * 2 - 50;
  const lines = doc.splitTextToSize(nomCommercant, maxWidth);
  doc.text(lines, pageWidth - margin - 30, currentY);
  currentY += infoSpacing * (lines.length > 1 ? lines.length : 1);

  // Motif (si présent)
  if (retrait.motif) {
    doc.setFont('helvetica', 'bold');
    doc.text('Motif:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    const motifLines = doc.splitTextToSize(retrait.motif, maxWidth);
    doc.text(motifLines, pageWidth - margin - 30, currentY);
    currentY += infoSpacing * (motifLines.length > 1 ? motifLines.length : 1);
  }

  // Caissier
  doc.setFont('helvetica', 'bold');
  doc.text('Caissier:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(retrait.utilisateurCaisse.email, pageWidth - margin - 30, currentY);
  currentY += infoSpacing * 2;

  // Section montant
  doc.setFillColor(245, 247, 250); // #f5f7fa
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 30, 3, 3, 'F');
  
  currentY += 10;
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  doc.text('Montant retiré', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(62, 184, 129); // #3EB881
  const montantStr = `${Number(retrait.montant).toLocaleString('fr-FR')} FCFA`;
  doc.text(montantStr, pageWidth / 2, currentY, { align: 'center' });

  currentY += 25;

  // Solde avant et après
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const soldeAvant = Number(retrait.compte.soldeActuel) + Number(retrait.montant);
  doc.setFont('helvetica', 'bold');
  doc.text('Solde avant retrait:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${soldeAvant.toLocaleString('fr-FR')} FCFA`, pageWidth - margin - 30, currentY);
  currentY += infoSpacing;

  doc.setFont('helvetica', 'bold');
  doc.text('Nouveau solde:', margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Number(retrait.compte.soldeActuel).toLocaleString('fr-FR')} FCFA`, pageWidth - margin - 30, currentY);
  currentY += infoSpacing * 2;

  // Pied de page
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(238, 238, 238);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  currentY = footerY + 5;
  doc.setFontSize(9);
  doc.setTextColor(153, 153, 153);
  doc.text('Ce document est généré automatiquement et constitue une preuve de transaction.', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.text('Merci de votre confiance.', pageWidth / 2, currentY, { align: 'center' });

  // Télécharger le PDF
  doc.save(`retrait_${retrait.idRetrait}.pdf`);
}

