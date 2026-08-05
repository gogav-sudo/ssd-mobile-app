import React from 'react';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { YesNoButtons } from '@/components/ui/YesNoButtons';
import { useReportProblem } from '@/context/ReportProblemContext';

export default function ReportPhotoChoiceScreen() {
  const router = useRouter();
  const { setWantsPhoto, setPhotoUri } = useReportProblem();

  const handleYes = () => {
    setWantsPhoto(true);
    router.push('/employee/report/photo');
  };

  const handleNo = () => {
    setWantsPhoto(false);
    setPhotoUri(null);
    router.push('/employee/report/urgency');
  };

  return (
    <WizardLayout
      step={3}
      totalSteps={5}
      eyebrow="СООБЩИТЬ О ПРОБЛЕМЕ"
      question="Нужно ли приложить фото?"
      footer={<YesNoButtons onYes={handleYes} onNo={handleNo} />}
      onClose={() => router.replace('/employee')}
      onBack={() => router.back()}
    />
  );
}
