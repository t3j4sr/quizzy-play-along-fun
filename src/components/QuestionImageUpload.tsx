
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuestionImageUploadProps {
  onImageAdd: (imageUrl: string) => void;
  currentImage?: string;
  onImageRemove: () => void;
}

export function QuestionImageUpload({ onImageAdd, currentImage, onImageRemove }: QuestionImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `question-image-${timestamp}-${file.name}`;
      
      // For now, we'll use a placeholder URL since we don't have actual file upload
      // In a real implementation, you'd upload to your storage service here
      const imageUrl = `/lovable-uploads/${fileName}`;
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onImageAdd(imageUrl);
      toast({ title: 'Image uploaded successfully!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  if (currentImage) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-4">
          <div className="relative">
            <img 
              src={currentImage} 
              alt="Question image" 
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              onClick={onImageRemove}
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-6">
        <div className="text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Add an image to your question</p>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button 
              disabled={isUploading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG up to 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
