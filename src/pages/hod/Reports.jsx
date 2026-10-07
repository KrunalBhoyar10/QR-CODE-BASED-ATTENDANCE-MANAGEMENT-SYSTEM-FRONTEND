import React, { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { hodService } from '../../services/hod.service';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await hodService.getReportsSummary(params);
      setReportData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading && !reportData) return <Loader fullPage message="Compiling department report..." />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Reports</h1>
          <p className="text-slate-500 mt-1">Backend-generated summary of your department</p>
        </div>
        <Button onClick={() => window.print()} leftIcon={<Download className="w-4 h-4" />}>
          Export / Print
        </Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchReport(); }} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <Input type="date" label="Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[180px]">
              <Input type="date" label="End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button type="submit" leftIcon={<FileText className="w-4 h-4" />}>Generate</Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={fetchReport} />
      ) : reportData ? (
        <div className="space-y-6" id="printable-report">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Programs', value: reportData.totalPrograms || 0, color: 'indigo' },
              { label: 'Total Sections', value: reportData.totalSections || 0, color: 'emerald' },
              { label: 'Total Teachers', value: reportData.totalTeachers || 0, color: 'blue' },
              { label: 'Active Students', value: reportData.totalStudents || 0, color: 'purple' }
            ].map(stat => (
              <Card key={stat.label} className={`bg-${stat.color}-50/50 border-${stat.color}-100`}>
                <CardContent className="p-4">
                  <p className={`text-sm font-medium text-${stat.color}-800`}>{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-900 mt-1`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Program Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Program', 'Sections', 'Students', 'Avg Attendance', 'Trend'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {reportData.programs?.map((prog, i) => {
                      const att = parseFloat(prog.attendancePercentage || 0);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {prog.name} <span className="text-xs text-slate-400">({prog.code})</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{prog._count?.sections ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{prog.totalStudents ?? '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              att >= 75 ? 'bg-emerald-100 text-emerald-800' :
                              att >= 60 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{att.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4">
                            {att >= 75 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                             att >= 60 ? <Minus className="w-4 h-4 text-amber-500" /> :
                             <TrendingDown className="w-4 h-4 text-rose-500" />}
                          </td>
                        </tr>
                      );
                    })}
                    {(!reportData.programs || reportData.programs.length === 0) && (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">No data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <style>{`
        @media print {
          @page { margin: 2cm; }
          body { -webkit-print-color-adjust: exact; }
          aside, header, .print\\:hidden { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
