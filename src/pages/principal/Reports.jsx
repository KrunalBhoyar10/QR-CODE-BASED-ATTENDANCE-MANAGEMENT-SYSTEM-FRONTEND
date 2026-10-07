import React, { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { principalService } from '../../services/principal.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  
  // Date range for report generation
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await principalService.getReportsSummary(params);
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

  const handleGenerateReport = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !reportData) {
    return <Loader fullPage message="Compiling institutional report..." />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Reports</h1>
          <p className="text-slate-500 mt-1">Comprehensive summary and analytics</p>
        </div>
        <Button onClick={handlePrint} leftIcon={<Download className="w-4 h-4" />}>
          Export / Print Report
        </Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleGenerateReport} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button type="submit" leftIcon={<FileText className="w-4 h-4" />}>
              Generate Report
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={fetchReport} />
      ) : reportData ? (
        <div className="space-y-8" id="printable-report">
          
          <div className="hidden print:block text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">QR Attendance System</h1>
            <h2 className="text-xl font-semibold text-slate-700 mt-2">Institutional Report</h2>
            <p className="text-slate-500 mt-1">
              {startDate && endDate ? `${startDate} to ${endDate}` : 'Overall Snapshot'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
            <Card className="bg-indigo-50/50 border-indigo-100">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-indigo-800">Total Departments</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{reportData.totalDepartments || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/50 border-emerald-100">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-emerald-800">Total Programs</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{reportData.totalPrograms || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/50 border-amber-100">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-amber-800">Total Sections</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{reportData.totalSections || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-blue-800">Active Students</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{reportData.totalStudents || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Department Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Programs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {reportData.departments?.map((dept, idx) => {
                      const att = parseFloat(dept.attendancePercentage || 0);
                      const isGood = att >= 75;
                      const isWarning = att < 75 && att >= 60;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {dept.name} <span className="text-xs text-slate-400 ml-1">({dept.code})</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{dept._count?.programs || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{dept.totalStudents || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isGood ? 'bg-emerald-100 text-emerald-800' :
                              isWarning ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {att.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {isGood ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : 
                             isWarning ? <Minus className="w-4 h-4 text-amber-500" /> : 
                             <TrendingDown className="w-4 h-4 text-rose-500" />}
                          </td>
                        </tr>
                      );
                    })}
                    {(!reportData.departments || reportData.departments.length === 0) && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                          No department data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      ) : null}
      
      {/* Print-only styles injected to hide sidebar, etc during printing if not handled by layout */}
      <style>{`
        @media print {
          @page { margin: 2cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #printable-report { width: 100%; display: block; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
