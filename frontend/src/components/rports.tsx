import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, RefreshCcw, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = 'https://final-year-project-jy2j.onrender.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

interface EventSummary { id: string; title: string; attendeeCount: number; date: string; type: string; location: string; }

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'attendees' | 'pdf'>('overview');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [pdfPeriod, setPdfPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (activeTab === 'events' || activeTab === 'overview' || activeTab === 'attendees') fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const r = await axios.get(`${API}/events/organizer/events`, { headers: authHeaders() });
      setEvents(r.data.data.map((e: any) => ({
        id: e._id, title: e.title,
        attendeeCount: e.attendees?.length ?? 0,
        date: new Date(e.startDate).toLocaleDateString(),
        type: e.type, location: e.location?.city || 'N/A'
      })));
    } catch { toast.error('Failed to fetch events'); }
    finally { setIsLoading(false); }
  };

  const downloadCsv = async (url: string, filename: string) => {
    try {
      const r = await axios.get(url, { headers: authHeaders(), responseType: 'blob' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([r.data]));
      link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove();
    } catch { toast.error('Failed to download report'); }
  };

  const generatePdf = async () => {
    setGeneratingPdf(true);
    try {
      const r = await axios.get(`${API}/reports/pdf/${pdfPeriod}`, { headers: authHeaders(), responseType: 'blob' });
      const blob = new Blob([r.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      // Open in new tab so browser can print-to-PDF
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          setTimeout(() => { win.print(); }, 500);
        };
      }
      toast.success(`${pdfPeriod.charAt(0).toUpperCase() + pdfPeriod.slice(1)} report opened — use Print → Save as PDF`);
    } catch { toast.error('Failed to generate PDF report'); }
    finally { setGeneratingPdf(false); }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'events', label: 'Event Reports' },
    { key: 'attendees', label: 'Attendee Reports' },
    { key: 'pdf', label: 'PDF Reports' },
  ] as const;

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <button onClick={fetchEvents} className="flex items-center px-3 py-2 text-sm bg-white border rounded-md shadow-sm hover:bg-gray-50">
          <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 font-medium ${activeTab === t.key ? 'text-tiffany-600 border-b-2 border-tiffany-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: 'Total Events', value: events.length },
              { label: 'Total Attendees', value: events.reduce((s, e) => s + e.attendeeCount, 0) },
              { label: 'Upcoming Events', value: events.filter(e => new Date(e.date) >= new Date()).length },
            ].map(c => (
              <div key={c.label} className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">{c.label}</h3>
                <p className="text-3xl font-bold text-tiffany-600">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Recent Events</h3>
              <button onClick={() => downloadCsv(`${API}/reports/events/summary`, `events-summary-${new Date().toISOString().split('T')[0]}.csv`)}
                className="flex items-center px-3 py-2 text-sm bg-tiffany-600 text-white rounded-md hover:bg-tiffany-700">
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                {['Event', 'Date', 'Type', 'Attendees', 'Action'].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.slice(0, 5).map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">{e.title}</td>
                    <td className="px-4 py-3">{e.date}</td>
                    <td className="px-4 py-3">{e.type}</td>
                    <td className="px-4 py-3">{e.attendeeCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => downloadCsv(`${API}/events/${e.id}/attendees`, `${e.title}-attendees.csv`)} className="text-tiffany-600 hover:text-tiffany-900 text-xs">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Reports */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Event Reports</h2>
            <button onClick={() => downloadCsv(`${API}/reports/events/summary`, `events-summary-${new Date().toISOString().split('T')[0]}.csv`)}
              className="flex items-center px-3 py-2 text-sm bg-tiffany-600 text-white rounded-md hover:bg-tiffany-700">
              <Download className="w-4 h-4 mr-2" /> Download All (CSV)
            </button>
          </div>
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                {['Event', 'Date', 'Location', 'Type', 'Attendees', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">{e.title}</td>
                    <td className="px-4 py-3">{e.date}</td>
                    <td className="px-4 py-3">{e.location}</td>
                    <td className="px-4 py-3">{e.type}</td>
                    <td className="px-4 py-3">{e.attendeeCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => downloadCsv(`${API}/events/${e.id}/attendees`, `${e.title}-attendees.csv`)}
                        className="inline-flex items-center px-2 py-1 text-xs rounded text-tiffany-700 bg-tiffany-100 hover:bg-tiffany-200">
                        <Download className="w-3 h-3 mr-1" /> Attendees
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && events.length === 0 && <div className="py-12 text-center text-gray-400">No events found.</div>}
            {isLoading && <div className="py-12 text-center text-gray-400">Loading...</div>}
          </div>
        </div>
      )}

      {/* Attendee Reports */}
      {activeTab === 'attendees' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-medium">Generate Attendee Report</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
            <select value={selectedEvent || ''} onChange={e => setSelectedEvent(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-tiffany-500 focus:border-tiffany-500">
              <option value="">-- Select an event --</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title} ({e.date})</option>)}
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={() => selectedEvent && downloadCsv(`${API}/events/${selectedEvent}/attendees`, `attendees-${selectedEvent}.csv`)}
              disabled={!selectedEvent}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white ${selectedEvent ? 'bg-tiffany-600 hover:bg-tiffany-700' : 'bg-gray-300 cursor-not-allowed'}`}>
              <Download className="w-4 h-4 mr-2" /> Download CSV
            </button>
          </div>
        </div>
      )}

      {/* PDF Reports */}
      {activeTab === 'pdf' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-1">Generate PDF Report</h3>
            <p className="text-sm text-gray-500">Select a period to generate a printable report. The report will open in a new tab — use <strong>Print → Save as PDF</strong>.</p>
          </div>

          <div className="flex gap-3">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setPdfPeriod(p)}
                className={`px-5 py-2 rounded-lg font-medium capitalize border transition ${pdfPeriod === p ? 'bg-tiffany-600 text-white border-tiffany-600' : 'bg-white text-gray-700 border-gray-300 hover:border-tiffany-400'}`}>
                {p}
              </button>
            ))}
          </div>

          <div className="bg-tiffany-50 border border-tiffany-200 rounded-lg p-4 text-sm text-tiffany-800">
            <strong>{pdfPeriod.charAt(0).toUpperCase() + pdfPeriod.slice(1)} report</strong> covers:{' '}
            {pdfPeriod === 'daily' && 'Today only'}
            {pdfPeriod === 'weekly' && 'Last 7 days'}
            {pdfPeriod === 'monthly' && 'Last 30 days'}
          </div>

          <button onClick={generatePdf} disabled={generatingPdf}
            className="flex items-center px-6 py-3 bg-tiffany-600 text-white rounded-lg hover:bg-tiffany-700 disabled:opacity-60 font-medium">
            <FileText className="w-5 h-5 mr-2" />
            {generatingPdf ? 'Generating...' : `Generate ${pdfPeriod.charAt(0).toUpperCase() + pdfPeriod.slice(1)} PDF`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
