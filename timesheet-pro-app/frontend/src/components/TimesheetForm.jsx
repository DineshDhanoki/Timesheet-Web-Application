import { useEffect, useMemo, useState } from 'react';

// Mock API object to simulate network requests, as the original API is not available.
const api = {
  post: async (url, payload) => {
    console.log('Mock API POST:', url, payload);
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500)); 
    if (url.includes('/submit')) {
      // Mock response for submission
      return { data: { message: 'Submitted successfully' } };
    }
    // Mock response for saving, returning a random ID
    return { data: { id: `TS${Math.floor(Math.random() * 900) + 100}` } };
  }
};

// Helper function to format date for display
const formatDate = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
};

// Helper function to add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Helper function to get current week's Monday
const getCurrentWeekMonday = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().slice(0, 10);
};

// Generates the 7 days of the week from a given start date
const generateDaysFromStartDate = (startDate) => {
  const start = new Date(startDate);
  const items = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(start, i);
    const dateString = currentDate.toISOString().slice(0, 10);
    items.push({
      date: dateString,
      displayDate: formatDate(currentDate),
      hours: 0,
      description: ''
    });
  }
  return items;
};

export default function TimesheetForm({ token, draftToEdit, onDraftSaved, onTimesheetSubmitted, editingDraft, onEditComplete }) {
  const [startDate, setStartDate] = useState(getCurrentWeekMonday());
  const [entries, setEntries] = useState(() => generateDaysFromStartDate(getCurrentWeekMonday()));
  const [client, setClient] = useState('Claris International Inc');
  const [manager, setManager] = useState('Sudheer Tivare');
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const total = useMemo(() => entries.reduce((a, b) => a + Number(b.hours || 0), 0), [entries]);

  // Update entries when start date changes
  useEffect(() => {
    setEntries(generateDaysFromStartDate(startDate));
  }, [startDate]);
  
  // Pre-fill form if a draft is passed for editing
  useEffect(() => {
    if (draftToEdit) {
      setStartDate(draftToEdit.startDate);
      setEntries(draftToEdit.entries);
      setClient(draftToEdit.client || 'Claris International Inc');
      setManager(draftToEdit.manager || 'Sudheer Tivare');
    }
  }, [draftToEdit]);

  // Handle editing a draft from history
  useEffect(() => {
    if (editingDraft && editingDraft.data) {
      const draftData = editingDraft.data;
      setStartDate(draftData.startDate);
      setEntries(draftData.entries);
      setClient(draftData.client || 'Claris International Inc');
      setManager(draftData.manager || 'Sudheer Tivare');
      setSuccessMessage('Draft loaded for editing');
    }
  }, [editingDraft]);

  // Validation helper function
  const validateTimesheet = () => {
    const totalHours = entries.reduce((sum, row) => sum + (parseFloat(row?.hours) || 0), 0);
    if (totalHours === 0) {
      return "❌ Total hours cannot be 0. Please enter hours before submitting.";
    }
    const missingDescription = entries.some(
      (row) => (parseFloat(row.hours) || 0) > 0 && (!row.description || row.description.trim() === "")
    );
    if (missingDescription) {
      return "❌ Each entry with hours must have a work description.";
    }
    return null; // No error
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setError(null);
  }

  const save = async () => {
    clearMessages();
    const payload = { client, manager, entries, startDate };
    
    if (editingDraft) {
      // Update existing draft
      const { data } = await api.post('/timesheets', payload);
      setSuccessMessage('Draft updated #' + data.id);
      
      // Notify parent component that a draft was updated
      if (onDraftSaved) {
        onDraftSaved({ ...payload, id: data.id, isUpdate: true, originalId: editingDraft.id });
      }
      
      // Clear editing state
      if (onEditComplete) {
        onEditComplete();
      }
    } else {
      // Create new draft
      const { data } = await api.post('/timesheets', payload);
      setSuccessMessage('Saved draft #' + data.id);
      
      // Notify parent component that a draft was saved
      if (onDraftSaved) {
        onDraftSaved({ ...payload, id: data.id });
      }
    }
  };

  const generatePdf = async () => {
    clearMessages();
    const validationError = validateTimesheet();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Generate PDF using browser's print functionality
      generateTimesheetPDF({ client, manager, entries, startDate, total });
      setSuccessMessage('PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Function to generate and download PDF directly
  const generateTimesheetPDF = (data) => {
    console.log('Generating PDF with data:', data);
    
    // Create HTML content
    let htmlContent = '<!DOCTYPE html><html><head><title>Timesheet</title>';
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
    htmlContent += '<p><strong>Customer:</strong> ' + (data.client || 'N/A') + '</p>';
    htmlContent += '<p><strong>Date:</strong> ' + new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) + '</p>';
    htmlContent += '<p><strong>Timesheet ID:</strong> DDhanoki-' + Math.floor(Math.random() * 90000 + 10000) + '</p>';
    htmlContent += '<p><strong>Consultant:</strong> Dinesh Dhanoki</p>';
    htmlContent += '<p><strong>Manager:</strong> ' + (data.manager || 'N/A') + '</p>';
    
    htmlContent += '<table>';
    htmlContent += '<tr><th>Day</th><th>Regular Hrs.</th></tr>';
    
    if (data.entries && data.entries.length > 0) {
      data.entries.forEach(entry => {
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
    
    htmlContent += '<tr class="total"><td><strong>Total</strong></td><td><strong>' + (data.total || 0) + ' hours</strong></td></tr>';
    htmlContent += '</table>';
    htmlContent += '</div>';
    
    // Right Panel
    htmlContent += '<div class="panel">';
    htmlContent += '<div class="header">Delivery details</div>';
    
    htmlContent += '<table>';
    htmlContent += '<tr><th>Day</th><th>Description</th></tr>';
    
    if (data.entries && data.entries.length > 0) {
      data.entries.forEach(entry => {
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
      link.download = `Timesheet-${data.client || 'Draft'}-${new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}.html`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      console.log('PDF generated and downloaded successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Don't show alert here, let the parent function handle it
      throw error;
    }
  };

  const submitSheet = async () => {
    clearMessages();
    const validationError = validateTimesheet();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = { client, manager, entries, startDate };
    const { data } = await api.post('/timesheets', payload);
    await api.post(`/timesheets/${data.id}/submit`);
    
    // Call the callback to add to history
    if (onTimesheetSubmitted) {
      onTimesheetSubmitted({ ...payload, id: data.id, isUpdate: editingDraft ? true : false, originalId: editingDraft?.id });
    }
    
    // Clear editing state if we were editing
    if (editingDraft && onEditComplete) {
      onEditComplete();
    }
    
    setSuccessMessage('Submitted for approval!');
  };

  const updateEntry = (i, patch) => {
    setEntries(prev => {
      const cp = [...prev];
      cp[i] = { ...cp[i], ...patch };
      return cp;
    });
  };

  return (
    <div className="grid gap-6">
      {/* Edit Mode Indicator */}
      {editingDraft && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-600 dark:text-yellow-400 text-lg">✏️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Editing Draft #{editingDraft.id}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Make your changes and save or submit the timesheet.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">

        {/* Date Picker Section */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Week Starting Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select the first day of your timesheet week.
          </p>
        </div>

        {/* Client and Manager Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer
            </label>
            <input
              className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={client}
              onChange={e => setClient(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manager
            </label>
            <input
              className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={manager}
              onChange={e => setManager(e.target.value)}
            />
          </div>
        </div>

        {/* Time Entries Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700">
                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600">Date</th>
                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600">Day</th>
                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300 w-24 border border-gray-300 dark:border-slate-600">Hours</th>
                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600">Work Description</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row, i) => (
                <tr key={row.date} className="even:bg-gray-50 dark:even:bg-slate-700/30 hover:bg-gray-100 dark:hover:bg-slate-700/50">
                  <td className="p-3 border border-gray-300 dark:border-slate-600">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {row.displayDate.split(', ')[1]}
                    </div>
                  </td>
                  <td className="p-3 border border-gray-300 dark:border-slate-600">
                    <div className="text-gray-900 dark:text-gray-100">{row.displayDate.split(',')[0]}</div>
                  </td>
                  <td className="p-3 border border-gray-300 dark:border-slate-600">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      className="w-20 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={row.hours}
                      onChange={e => updateEntry(i, { hours: e.target.value })}
                    />
                  </td>
                  <td className="p-3 border border-gray-300 dark:border-slate-600">
                    <input
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={row.description}
                      onChange={e => updateEntry(i, { description: e.target.value })}
                      placeholder="Work description..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 dark:bg-slate-600">
                <td className="p-3 font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600" colSpan={2}>Total Hours</td>
                <td className="p-3 font-bold text-lg text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-slate-600">{total}</td>
                <td className="border border-gray-300 dark:border-slate-600"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Action Buttons & Messages */}
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={save}
            className="px-6 py-2 rounded-xl bg-gray-900 dark:bg-slate-600 hover:bg-gray-800 dark:hover:bg-slate-500 text-white font-medium transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={generatePdf}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Generate PDF
          </button>
          <button
            onClick={submitSheet}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            Submit
          </button>
          <div className="ml-auto">
            {successMessage && (
              <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-xl text-sm font-medium">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}