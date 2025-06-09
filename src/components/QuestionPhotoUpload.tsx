
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuestionPhotoUploadProps {
  onPhotoAdd: (photoUrl: string) => void;
  currentPhoto?: string;
  onPhotoRemove: () => void;
}

export function QuestionPhotoUpload({ onPhotoAdd, currentPhoto, onPhotoRemove }: QuestionPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be smaller than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for demo purposes
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoAdd(result);
        setIsUploading(false);
        toast({ title: 'Photo added successfully!' });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ title: 'Failed to upload photo', variant: 'destructive' });
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-white/30 bg-white/5">
      <CardContent className="p-4">
        {currentPhoto ? (
          <div className="relative">
            <img 
              src={currentPhoto} 
              alt="Question" 
              className="w-full h-32 object-cover rounded-lg"
            />
            <Button
              onClick={onPhotoRemove}
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center justify-center py-8 text-white/70 hover:text-white transition-colors">
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="h-8 w-8" />
                </div>
              ) : (
                <>
                  <Image className="h-8 w-8 mb-2" />
                  <span className="text-sm text-center">
                    Click to add a photo to this question
                  </span>
                  <span className="text-xs text-white/50 mt-1">
                    PNG, JPG up to 5MB
                  </span>
                </>
              )}
            </div>
          </label>
        )}
      </CardContent>
    </Card>
  );
}
