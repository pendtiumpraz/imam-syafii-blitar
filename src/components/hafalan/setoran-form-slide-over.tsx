'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Save, Calendar as CalendarIcon, User, Book } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Student {
  id: string;
  fullName: string;
  nickname?: string;
  photo?: string;
}

interface Surah {
  id: string;
  number: number;
  name: string;
  nameArabic: string;
  totalAyat: number;
  juz: number;
  type: string;
}

interface SetoranRecord {
  id: string;
  studentId: string;
  surahNumber: number;
  startAyat: number;
  endAyat: number;
  status: string;
  quality: string;
  teacherId: string;
  date: string;
  notes?: string;
  voiceNoteUrl?: string;
  student: {
    id: string;
    fullName: string;
    nickname?: string;
    photo?: string;
  };
  surah: {
    number: number;
    name: string;
    nameArabic: string;
    totalAyat: number;
    juz: number;
  };
  teacher: {
    id: string;
    name: string;
  };
}

interface SetoranFormSlideOverProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  editingRecord: SetoranRecord | null;
  students: Student[];
  surahs: Surah[];
  selectedStudent?: Student | null;
}

export function SetoranFormSlideOver({
  isOpen,
  onClose,
  editingRecord,
  students,
  surahs,
  selectedStudent
}: SetoranFormSlideOverProps) {
  const [formData, setFormData] = useState({
    studentId: selectedStudent?.id || '',
    surahNumber: '',
    startAyat: 1,
    endAyat: 1,
    status: 'BARU',
    quality: 'B',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    voiceNoteUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        studentId: editingRecord.studentId,
        surahNumber: editingRecord.surahNumber.toString(),
        startAyat: editingRecord.startAyat,
        endAyat: editingRecord.endAyat,
        status: editingRecord.status,
        quality: editingRecord.quality,
        date: new Date(editingRecord.date).toISOString().split('T')[0],
        notes: editingRecord.notes || '',
        voiceNoteUrl: editingRecord.voiceNoteUrl || ''
      });
      const surah = surahs.find(s => s.number === editingRecord.surahNumber);
      setSelectedSurah(surah || null);
    } else if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        studentId: selectedStudent.id
      }));
    }
  }, [editingRecord, selectedStudent, surahs]);

  useEffect(() => {
    if (formData.surahNumber) {
      const surah = surahs.find(s => s.number === parseInt(formData.surahNumber));
      setSelectedSurah(surah || null);
    }
  }, [formData.surahNumber, surahs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingRecord
        ? `/api/hafalan/record/${editingRecord.id}`
        : '/api/hafalan/record';

      const response = await fetch(url, {
        method: editingRecord ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          surahNumber: parseInt(formData.surahNumber),
          startAyat: parseInt(formData.startAyat.toString()),
          endAyat: parseInt(formData.endAyat.toString())
        })
      });

      if (response.ok) {
        toast.success(
          editingRecord
            ? 'Data setoran berhasil diperbarui'
            : 'Data setoran berhasil ditambahkan'
        );
        onClose(true);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menyimpan data setoran');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: selectedStudent?.id || '',
      surahNumber: '',
      startAyat: 1,
      endAyat: 1,
      status: 'BARU',
      quality: 'B',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      voiceNoteUrl: ''
    });
    setSelectedSurah(null);
  };

  const handleClose = () => {
    resetForm();
    onClose(false);
  };

  const STATUS_OPTIONS = [
    { value: 'BARU', label: 'Baru', color: 'bg-orange-100 text-orange-800' },
    { value: 'MURAJA\'AH', label: 'Muraja\'ah', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'LANCAR', label: 'Lancar', color: 'bg-blue-100 text-blue-800' },
    { value: 'MUTQIN', label: 'Mutqin', color: 'bg-green-100 text-green-800' }
  ];

  const QUALITY_OPTIONS = [
    { value: 'A', label: 'A - Sangat Baik', color: 'bg-green-100 text-green-800' },
    { value: 'B', label: 'B - Baik', color: 'bg-blue-100 text-blue-800' },
    { value: 'C', label: 'C - Cukup', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'D', label: 'D - Kurang', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white px-6 py-6 border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-2xl font-semibold text-gray-900">
                            {editingRecord ? 'Edit Setoran Hafalan' : 'Tambah Setoran Hafalan'}
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-gray-500">
                            {editingRecord
                              ? 'Perbarui data setoran hafalan Al-Quran'
                              : 'Tambahkan data setoran hafalan Al-Quran baru'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                          onClick={handleClose}
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      <div className="space-y-6">
                        {/* Student Selection */}
                        <div>
                          <Label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                            Santri <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id="studentId"
                            required
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Pilih Santri</option>
                            {students.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.fullName} {student.nickname ? `(${student.nickname})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Surah Selection */}
                        <div>
                          <Label htmlFor="surahNumber" className="block text-sm font-medium text-gray-700">
                            Surah <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id="surahNumber"
                            required
                            value={formData.surahNumber}
                            onChange={(e) => setFormData({ ...formData, surahNumber: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Pilih Surah</option>
                            {surahs.map((surah) => (
                              <option key={surah.id} value={surah.number}>
                                {surah.number}. {surah.name} - {surah.nameArabic} ({surah.totalAyat} ayat)
                              </option>
                            ))}
                          </select>
                          {selectedSurah && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-md">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-blue-900">{selectedSurah.name}</p>
                                  <p className="text-xs text-blue-700">{selectedSurah.nameArabic}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline">Juz {selectedSurah.juz}</Badge>
                                  <Badge variant="outline">{selectedSurah.totalAyat} ayat</Badge>
                                  <Badge variant="outline">{selectedSurah.type}</Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ayat Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startAyat" className="block text-sm font-medium text-gray-700">
                              Ayat Awal <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="startAyat"
                              type="number"
                              min="1"
                              max={selectedSurah?.totalAyat || 1}
                              required
                              value={formData.startAyat}
                              onChange={(e) => setFormData({ ...formData, startAyat: parseInt(e.target.value) || 1 })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="endAyat" className="block text-sm font-medium text-gray-700">
                              Ayat Akhir <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="endAyat"
                              type="number"
                              min={formData.startAyat}
                              max={selectedSurah?.totalAyat || 1}
                              required
                              value={formData.endAyat}
                              onChange={(e) => setFormData({ ...formData, endAyat: parseInt(e.target.value) || 1 })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {formData.startAyat && formData.endAyat && formData.endAyat >= formData.startAyat && (
                          <div className="text-sm text-gray-600">
                            Total: <span className="font-semibold">{formData.endAyat - formData.startAyat + 1}</span> ayat
                          </div>
                        )}

                        {/* Status */}
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Status Hafalan <span className="text-red-500">*</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, status: option.value })}
                                className={`p-3 rounded-md border-2 text-sm font-medium transition-all ${
                                  formData.status === option.value
                                    ? `${option.color} border-current`
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quality */}
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Kualitas Hafalan <span className="text-red-500">*</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {QUALITY_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, quality: option.value })}
                                className={`p-3 rounded-md border-2 text-sm font-medium transition-all ${
                                  formData.quality === option.value
                                    ? `${option.color} border-current`
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Date */}
                        <div>
                          <Label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Tanggal Setoran <span className="text-red-500">*</span>
                          </Label>
                          <div className="mt-1 relative">
                            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="date"
                              type="date"
                              required
                              value={formData.date}
                              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <Label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Catatan (Opsional)
                          </Label>
                          <Textarea
                            id="notes"
                            rows={3}
                            placeholder="Tambahkan catatan mengenai hafalan, mood santri, atau hal penting lainnya..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        {/* Voice Note URL */}
                        <div>
                          <Label htmlFor="voiceNoteUrl" className="block text-sm font-medium text-gray-700">
                            URL Rekaman Suara (Opsional)
                          </Label>
                          <Input
                            id="voiceNoteUrl"
                            type="url"
                            placeholder="https://example.com/recording.mp3"
                            value={formData.voiceNoteUrl}
                            onChange={(e) => setFormData({ ...formData, voiceNoteUrl: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 z-10 bg-gray-50 px-6 py-4 border-t">
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClose}
                          disabled={loading}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? 'Menyimpan...' : editingRecord ? 'Perbarui' : 'Simpan'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
