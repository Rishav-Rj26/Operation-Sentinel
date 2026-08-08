import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from './Toast';

const ReportGenerator = ({ stats, incidents, units }) => {
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  const generatePDF = () => {
    try {
      setGenerating(true);
      const doc = new jsPDF();
      
      const now = new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
      const criticalCount = incidents?.filter(i => i.severity === 'critical' && i.status !== 'closed').length || 0;
      const deployedUnits = units?.filter(u => u.status !== 'Available' && u.status !== 'Off Duty').length || 0;

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SENTINEL COMMAND REPORT', 14, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Generated: ${now}  |  Classification: OPERATIONAL`, 14, 30);

      // Stats Section
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('System Overview', 14, 52);

      const statsData = [
        ['Active Incidents', stats?.activeIncidents || '0'],
        ['Critical Alerts', criticalCount.toString()],
        ['Units Deployed', deployedUnits.toString()],
        ['Resolved Today', stats?.resolvedToday || '0']
      ];

      autoTable(doc, {
        startY: 58,
        body: [statsData.map(s => s[1]), statsData.map(s => s[0])],
        theme: 'plain',
        styles: { halign: 'center', cellPadding: 4 },
        bodyStyles: { 
          0: { fontSize: 20, fontStyle: 'bold', textColor: [59, 130, 246] }, // values
          1: { fontSize: 9, textColor: [100, 116, 139], fontStyle: 'bold', textTransform: 'uppercase' } // labels
        },
        margin: { left: 14, right: 14 }
      });

      // Active Incidents Table
      const finalY = doc.lastAutoTable.finalY || 85;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Active Incident Log', 14, finalY + 15);

      const tableData = (incidents || [])
        .filter(i => i.status !== 'closed' && i.status !== 'resolved')
        .slice(0, 20)
        .map(i => [
          i.title,
          i.severity.toUpperCase(),
          i.status.charAt(0).toUpperCase() + i.status.slice(1),
          i.location || '—'
        ]);

      autoTable(doc, {
        startY: finalY + 22,
        head: [['Incident', 'Severity', 'Status', 'Location']],
        body: tableData.length ? tableData : [['No active incidents', '', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount}  •  Sentinel Police Command System v2.0  •  Confidential`,
          105,
          290,
          { align: 'center' }
        );
      }

      doc.save(`Sentinel_Report_${new Date().getTime()}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className="btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card text-sm font-medium text-slate-300 hover:text-white transition-all hover:border-blue-500/30 group disabled:opacity-50"
    >
      {generating ? <Download className="w-4 h-4 animate-bounce" /> : <FileText className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />}
      {generating ? 'Exporting...' : 'Export Report'}
    </button>
  );
};

export default ReportGenerator;
