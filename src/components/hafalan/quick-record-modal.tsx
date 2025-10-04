'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AyatSelector } from './ayat-selector';
import { QualitySelector } from './quality-selector';
import { Mic, MicOff, Save, X, Book, Clock, FileText, Volume2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Surah {
  id: string;
  number: number;
  name: string;
  nameArabic: string;
  totalAyat: number;
  juz: number;
  type: string;
}

interface Student {
  id: string;
  fullName: string;
  nickname?: string;
  photo?: string;
}

interface QualityScore {
  overall: string;
  fluency?: string;
  tajweed?: string;
  makharijul?: string;
}

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  surah: Surah | null;
  student: Student | null;
  type?: 'SETORAN_BARU' | 'MURAJA\'AH' | 'TES_HAFALAN';
}

export function QuickRecordModal({
  isOpen,
  onClose,
  surah,
  student,
  type = 'SETORAN_BARU'
}: QuickRecordModalProps) {
  const [startAyat, setStartAyat] = useState(1);
  const [endAyat, setEndAyat] = useState(1);
  const [status, setStatus] = useState('BARU');
  const [quality, setQuality] = useState<QualityScore>({
    overall: 'B'
  });
  const [duration, setDuration] = useState('15');
  const [notes, setNotes] = useState('');
  const [corrections, setCorrections] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  const STATUS_OPTIONS = [
    { value: 'BARU', label: 'Baru', color: 'bg-orange-100 text-orange-800' },
    { value: 'MURAJA\'AH', label: 'Muraja\'ah', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'LANCAR', label: 'Lancar', color: 'bg-blue-100 text-blue-800' },
    { value: 'MUTQIN', label: 'Mutqin', color: 'bg-green-100 text-green-800' }
  ];

  const getTypeConfig = () => {
    switch (type) {
      case 'MURAJA\'AH':
        return {
          title: 'Muraja\'ah',
          description: 'Mengulang hafalan yang sudah pernah disetorkan',
          defaultStatus: 'MURAJA\'AH',
          icon: Clock,
          color: 'text-yellow-600'
        };
      case 'TES_HAFALAN':
        return {
          title: 'Tes Hafalan',
          description: 'Evaluasi kemampuan hafalan santri',
          defaultStatus: 'LANCAR',
          icon: FileText,
          color: 'text-blue-600'
        };
      default:
        return {
          title: 'Setoran Baru',
          description: 'Menambah hafalan baru',
          defaultStatus: 'BARU',
          icon: Book,
          color: 'text-green-600'
        };
    }
  };

  const typeConfig = getTypeConfig();

  const handleRangeChange = (start: number, end: number) => {
    setStartAyat(start);
    setEndAyat(end);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording logic here
      setIsRecording(false);
      toast.success('Perekaman selesai');
    } else {
      // Start recording logic here
      setIsRecording(true);
      toast.info('Mulai merekam...');
    }
  };

  const handleSave = async () => {
    if (!student || !surah) return;

    setLoading(true);
    try {
      const recordData = {
        studentId: student.id,
        surahNumber: surah.number,
        startAyat,
        endAyat,
        status,
        quality: quality.overall,
        fluency: quality.fluency,
        tajweed: quality.tajweed,
        makharijul: quality.makharijul,
        duration: parseInt(duration),
        notes,
        corrections
      };

      const response = await fetch('/api/hafalan/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });

      if (response.ok) {
        toast.success('Hafalan berhasil disimpan!');
        onClose();
        // Reset form
        resetForm();
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        toast.error(error.error || error.message || 'Gagal menyimpan hafalan');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStartAyat(1);
    setEndAyat(1);
    setStatus(typeConfig.defaultStatus);
    setQuality({ overall: 'B', fluency: undefined, tajweed: undefined, makharijul: undefined });
    setDuration('15');
    setNotes('');
    setCorrections('');
    setIsRecording(false);
    setRecordingBlob(null);
  };

  if (!isOpen || !surah || !student) return null;

  const TypeIcon = typeConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-gray-900">
            <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
            <div>
              <div>{typeConfig.title} - {surah.name}</div>
              <div className="text-sm text-gray-500 font-normal">
                {student.fullName} • {typeConfig.description}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Surah Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{surah.name}</h3>
                  <p className="text-gray-600 font-arabic">{surah.nameArabic}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">Surah {surah.number}</Badge>
                    <Badge variant="outline">Juz {surah.juz}</Badge>
                    <Badge variant="outline">{surah.totalAyat} ayat</Badge>
                    <Badge variant="outline">{surah.type}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{surah.number}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Dasar</TabsTrigger>
              <TabsTrigger value="assessment">Penilaian</TabsTrigger>
              <TabsTrigger value="notes">Catatan</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Ayat Range Selector */}
              <AyatSelector
                totalAyat={surah.totalAyat}
                startAyat={startAyat}
                endAyat={endAyat}
                onRangeChange={handleRangeChange}
              />

              {/* Status Selection */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Status Hafalan:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={status === option.value ? "default" : "outline"}
                        className={`
                          ${status === option.value ? option.color : 'hover:bg-gray-50'}
                        `}
                        onClick={() => setStatus(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Duration */}
              <Card>
                <CardContent className="p-4">
                  <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                    Durasi (menit):
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="120"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessment">
              <QualitySelector
                quality={quality}
                onChange={setQuality}
                simple={false}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              {/* Voice Recording */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Rekaman Suara (Opsional):
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={toggleRecording}
                      className="flex items-center gap-2"
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                    {recordingBlob && (
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Recording saved</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardContent className="p-4">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Catatan Tambahan:
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Catatan mengenai hafalan, mood santri, atau hal penting lainnya..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Corrections */}
              <Card>
                <CardContent className="p-4">
                  <Label htmlFor="corrections" className="text-sm font-medium text-gray-700">
                    Koreksi yang Diperlukan:
                  </Label>
                  <Textarea
                    id="corrections"
                    placeholder="Kesalahan yang perlu diperbaiki, saran untuk latihan..."
                    value={corrections}
                    onChange={(e) => setCorrections(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Hafalan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}