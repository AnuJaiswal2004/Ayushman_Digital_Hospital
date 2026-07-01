import React, { useState, useEffect } from 'react';
import { Building2, User, Users, BedDouble, AlertCircle, Plus, Minus } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';

export default function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({
    activeDepts: 0,
    totalDoctors: 0,
    occupiedBeds: 0,
    totalBeds: 0
  });

  const loadDepartments = async () => {
    const list = await apiService.getDepartments();
    setDepartments(list);
    
    // Compute summary metrics
    const totalDoctors = list.reduce((acc, curr) => acc + curr.doctors, 0);
    const occupiedBeds = list.reduce((acc, curr) => acc + curr.occupiedBeds, 0);
    const totalBeds = list.reduce((acc, curr) => acc + curr.totalBeds, 0);
    
    setSummary({
      activeDepts: list.filter(d => d.status === 'Active').length,
      totalDoctors,
      occupiedBeds,
      totalBeds
    });
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleAdjustBeds = async (key, currentBeds, maxBeds, direction) => {
    let newBeds = currentBeds + direction;
    if (newBeds < 0) newBeds = 0;
    if (newBeds > maxBeds) newBeds = maxBeds;

    try {
      await apiService.updateDepartmentOccupancy(key, newBeds);
      loadDepartments();
    } catch (err) {
      alert('Failed to update bed occupancy');
    }
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 85) return 'bg-rose-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getOccupancyTextClass = (percentage) => {
    if (percentage >= 85) return 'text-rose-600 dark:text-rose-400';
    if (percentage >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="space-y-6">
      {/* Department Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
        <Card elevated className="flex items-center gap-4 py-4 px-5">
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Departments</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">{summary.activeDepts} Divisions</span>
          </div>
        </Card>

        <Card elevated className="flex items-center gap-4 py-4 px-5">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Staff Size (Doctors)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">{summary.totalDoctors} Members</span>
          </div>
        </Card>

        <Card elevated className="flex items-center gap-4 py-4 px-5">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-500 shrink-0">
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Occupancy</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
              {summary.occupiedBeds} / {summary.totalBeds} Beds
            </span>
          </div>
        </Card>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => {
          const occupancyRate = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
          return (
            <Card key={dept.key} className="space-y-5 flex flex-col hover:border-slate-350 dark:hover:border-slate-700 transition-all text-left">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-lg font-heading">{dept.name}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    HOD: {dept.hod}
                  </span>
                </div>
                <Badge variant={dept.status === 'Active' ? 'success' : 'secondary'}>
                  {dept.status}
                </Badge>
              </div>

              {/* Department Vitals */}
              <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                <div>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase">Doctors Assigned</span>
                  <span className="text-slate-700 dark:text-slate-300">{dept.doctors} Specialists</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase">Total Beds</span>
                  <span className="text-slate-700 dark:text-slate-300">{dept.totalBeds} Units</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase">Available Beds</span>
                  <span className="text-slate-700 dark:text-slate-300">{dept.totalBeds - dept.occupiedBeds} Units</span>
                </div>
              </div>

              {/* Bed Occupancy Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 uppercase tracking-wider text-[9px] text-slate-400 dark:text-slate-500">
                    <BedDouble className="h-3.5 w-3.5" /> BED OCCUPANCY
                  </span>
                  <span className={getOccupancyTextClass(occupancyRate)}>{occupancyRate}% Occupied</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/20">
                  <div className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(occupancyRate)}`} style={{ width: `${occupancyRate}%` }} />
                </div>
              </div>

              {/* Occupancy Stepper */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Bed Allocation Stepper
                </span>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleAdjustBeds(dept.key, dept.occupiedBeds, dept.totalBeds, -1)}
                    disabled={dept.occupiedBeds <= 0}
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg shrink-0"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-white w-6 text-center">{dept.occupiedBeds}</span>
                  <Button
                    onClick={() => handleAdjustBeds(dept.key, dept.occupiedBeds, dept.totalBeds, 1)}
                    disabled={dept.occupiedBeds >= dept.totalBeds}
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
