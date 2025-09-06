import { useEffect, useState } from 'react';

export default function History({ token, onEdit, savedDrafts, onDeleteDraft }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        // Show only real saved drafts, no mock data
        setRows(savedDrafts || []);
      } catch (err) {
        setError('Failed to load timesheet history');
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    } else {
        setError('No token provided.');
        setLoading(false);
    }
  }, [token, savedDrafts]);

  // Function to generate PDF for saved drafts
  const generateDraftPDF = (timesheet) => {
    const printWindow = window.open('', '_blank');
    
    // Create HTML content using the actual draft data
    let htmlContent = '<!DOCTYPE html><html><head><title>Timesheet - ' + timesheet.id + '</title>';
    htmlContent += '<style>body{font-family:Arial,sans-serif;margin:20px;}';
    htmlContent += '.container{display:flex;gap:20px;}';
    htmlContent += '.panel{flex:1;border:2px solid #333;padding:15px;}';
    htmlContent += '.header{font-size:20px;font-weight:bold;text-align:center;margin-bottom:15px;}';
    htmlContent += 'table{width:100%;border-collapse:collapse;margin:10px 0;}';
    htmlContent += 'th,td{border:1px solid #333;padding:8px;text-align:left;}';
    htmlContent += 'th{background-color:#f0f0f0;font-weight:bold;}';
    htmlContent += '.weekend{color:red;font-weight:bold;}';
    htmlContent += '.total{background-color:#e0e0e0;font-weight:bold;}';
    htmlContent += '</style></head><body>';
    
    htmlContent += '<div class="container">';
    
    // Left Panel
    htmlContent += '<div class="panel">';
    htmlContent += '<div class="header">TechnoApex Ltd.</div>';
    htmlContent += '<p><strong>Customer:</strong> ' + (timesheet.data?.client || 'N/A') + '</p>';
    htmlContent += '<p><strong>Date:</strong> ' + new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) + '</p>';
    htmlContent += '<p><strong>Timesheet ID:</strong> ' + timesheet.id + '</p>';
    htmlContent += '<p><strong>Consultant:</strong> Dinesh Dhanoki</p>';
    htmlContent += '<p><strong>Manager:</strong> ' + (timesheet.data?.manager || 'N/A') + '</p>';
    
    htmlContent += '<table>';
    htmlContent += '<tr><th>Day</th><th>Regular Hrs.</th></tr>';
    
    if (timesheet.data?.entries && timesheet.data.entries.length > 0) {
      timesheet.data.entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayName = entryDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = entryDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
        const isWeekend = entryDate.getDay() === 0 || entryDate.getDay() === 6;
        const hours = entry.hours || 0;
        const weekendClass = isWeekend ? ' class="weekend"' : '';
        
        htmlContent += '<tr>';
        htmlContent += '<td' + weekendClass + '>' + dayName + ': ' + dateStr + '</td>';
        htmlContent += '<td' + weekendClass + '>' + hours + ' hours</td>';
        htmlContent += '</tr>';
      });
    }
    
    htmlContent += '<tr class="total"><td><strong>Total</strong></td><td><strong>' + (timesheet.total_hours || 0) + ' hours</strong></td></tr>';
    htmlContent += '</table>';
    htmlContent += '</div>';
    
    // Right Panel
    htmlContent += '<div class="panel">';
    htmlContent += '<div class="header">Delivery details</div>';
    
    htmlContent += '<table>';
    htmlContent += '<tr><th>Day</th><th>Description</th></tr>';
    
    if (timesheet.data?.entries && timesheet.data.entries.length > 0) {
      timesheet.data.entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayName = entryDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = entryDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
        const isWeekend = entryDate.getDay() === 0 || entryDate.getDay() === 6;
        const description = entry.description || 'No description provided';
        const weekendClass = isWeekend ? ' class="weekend"' : '';
        
        htmlContent += '<tr>';
        htmlContent += '<td' + weekendClass + '>' + dayName + ' (' + dateStr + '):</td>';
        htmlContent += '<td>' + description + '</td>';
        htmlContent += '</tr>';
      });
    }
    
    htmlContent += '</table>';
    htmlContent += '</div>';
    htmlContent += '</div>';
    htmlContent += '</body></html>';

    try {
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Timesheet-${timesheet.id}-${new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}.html`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs rounded font-medium";
    switch (status?.toLowerCase()) {
      case 'draft':
        return `${baseClasses} bg-yellow-500 text-white`;
      case 'submitted':
        return `${baseClasses} bg-green-600 text-white`;
      case 'approved':
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`;
      case 'rejected':
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 mb-2">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Timesheet History
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {rows.length} timesheet{rows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-2">📋</div>
          <p className="text-gray-600 dark:text-gray-400">No timesheets found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Create your first timesheet to see it here
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-slate-600">
                  ID
                </th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-slate-600">
                  Week Period
                </th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-slate-600">
                  Total Hours
                </th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-slate-600">
                  Status
                </th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, index) => (
                <tr
                  key={r.id}
                  className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-700/30'
                  }`}
                >
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-slate-700">
                    #{r.id}
                  </td>
                  <td className="p-4 text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-slate-700">
                    <div className="font-medium">
                      {r.week_start} → {r.week_end}
                    </div>
                  </td>
                  <td className="p-4 text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-slate-700">
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      {r.total_hours}h
                    </div>
                  </td>
                  <td className="p-4 border-r border-gray-100 dark:border-slate-700">
                    <span className={getStatusBadge(r.status)}>
                      {r.status || 'Draft'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {r.status?.toLowerCase() === 'draft' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => generateDraftPDF(r)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                          >
                            📄 Download PDF
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(r)}
                              className="inline-flex items-center px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                            >
                              ✏️ Edit
                            </button>
                          )}
                          {onDeleteDraft && (
                            <button
                              onClick={() => onDeleteDraft(r.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      ) : r.status?.toLowerCase() === 'submitted' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => generateDraftPDF(r)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                          >
                            📄 Download PDF
                          </button>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ✅ Submitted
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {r.status?.toLowerCase() === 'approved' ? '✅ Approved' : 
                           r.status?.toLowerCase() === 'rejected' ? '❌ Rejected' : 
                           'No actions available'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}