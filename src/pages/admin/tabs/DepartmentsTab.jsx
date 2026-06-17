import React, { useState, useEffect } from 'react';
import { Building2, User, Users, BedDouble, AlertCircle, Plus, Minus } from 'lucide-react';
import { apiService } from '../../../services/api.js';

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
    if (percentage >= 85) return 'text-rose-400';
    if (percentage >= 60) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="space-y-6">
      {/* Department Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Departments</span>
            <span className="text-2xl font-black text-white">{summary.activeDepts} Divisions</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-teal-500/10 p-3 rounded-xl text-teal-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Staff Size (Doctors)</span>
            <span className="text-2xl font-black text-white">{summary.totalDoctors} Members</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Occupancy</span>
            <span className="text-2xl font-black text-white">
              {summary.occupiedBeds} / {summary.totalBeds} Beds
            </span>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => {
          const occupancyRate = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
          return (
            <div key={dept.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 flex flex-col hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-lg font-heading">{dept.name}</h4>
                  <span className="text-xs text-slate-400 font-semibold font-sans flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    HOD: {dept.hod}
                  </span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                  {dept.status}
                </span>
              </div>

              {/* Department Vitals */}
              <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-400 pt-1">
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Doctors Assigned</span>
                  <span className="text-slate-300">{dept.doctors} Specialists</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Total Beds</span>
                  <span className="text-slate-300">{dept.totalBeds} Units</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Available Beds</span>
                  <span className="text-slate-300">{dept.totalBeds - dept.occupiedBeds} Units</span>
                </div>
              </div>

              {/* Bed Occupancy Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-450">
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5 text-slate-650" /> BED OCCUPANCY
                  </span>
                  <span className={getOccupancyTextClass(occupancyRate)}>{occupancyRate}% Occupied</span>
                </div>
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(occupancyRate)}`} style={{ width: `${occupancyRate}%` }} />
                </div>
              </div>

              {/* Occupancy Stepper */}
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-slate-650" /> Stepper: Bed Allocation
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAdjustBeds(dept.key, dept.occupiedBeds, dept.totalBeds, -1)}
                    disabled={dept.occupiedBeds <= 0}
                    className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono font-bold text-sm text-white w-6 text-center">{dept.occupiedBeds}</span>
                  <button
                    onClick={() => handleAdjustBeds(dept.key, dept.occupiedBeds, dept.totalBeds, 1)}
                    disabled={dept.occupiedBeds >= dept.totalBeds}
                    className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
