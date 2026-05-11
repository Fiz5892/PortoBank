import { useState } from 'react';
import { ProfileData } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, Crop } from 'lucide-react';
import { toast } from 'sonner';
import { AvatarCropper } from '@/components/onboarding/AvatarCropper';

interface ProfileStepProps {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
  isLoading?: boolean;
}

export const ProfileStep = ({ data, onChange, isLoading }: ProfileStepProps) => {
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Foto harus lebih kecil dari 10 MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Pilih file gambar');
      return;
    }
    const url = URL.createObjectURL(file);
    setRawSrc(url);
    setShowCropper(true);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedDataUrl: string) => {
    onChange({ ...data, avatar_url: croppedDataUrl });
    setShowCropper(false);
    if (rawSrc) URL.revokeObjectURL(rawSrc);
    setRawSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (rawSrc) URL.revokeObjectURL(rawSrc);
    setRawSrc(null);
  };

  const handleInputChange = (key: keyof ProfileData, value: string | null) => {
    onChange({ ...data, [key]: value });
  };

  if (showCropper && rawSrc) {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide">
            Sesuaikan Foto Profil
          </Label>
          <p className="text-xs text-gray-500 mt-0.5">
            Geser, zoom, lalu klik Apply
          </p>
        </div>
        <AvatarCropper
          imageSrc={rawSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          size={256}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Avatar Upload */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide">
          Profile Photo
        </Label>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={data.avatar_url || undefined} />
            <AvatarFallback>
              {data.full_name?.charAt(0).toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <Button asChild variant="outline" size="sm" disabled={isLoading}>
                <span className="flex items-center gap-2">
                  <Upload size={16} />
                  Upload
                </span>
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            {data.avatar_url && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRawSrc(data.avatar_url!);
                    setShowCropper(true);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <Crop size={15} />
                  Crop
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...data, avatar_url: null })}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <X size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-xs font-semibold">Full Name *</Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          value={data.full_name}
          onChange={(e) => handleInputChange('full_name', e.target.value)}
          disabled={isLoading}
          className="text-sm"
        />
      </div>

      {/* Profession */}
      <div className="space-y-1.5">
        <Label htmlFor="profession" className="text-xs font-semibold">Profession / Job Title *</Label>
        <Input
          id="profession"
          placeholder="Frontend Developer"
          value={data.profession}
          onChange={(e) => handleInputChange('profession', e.target.value)}
          disabled={isLoading}
          className="text-sm"
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-xs font-semibold">Location</Label>
        <Input
          id="location"
          placeholder="Jakarta, Indonesia"
          value={data.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          disabled={isLoading}
          className="text-sm"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={data.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={isLoading}
          className="text-sm"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio" className="text-xs font-semibold">Bio (max 300 characters)</Label>
        <Textarea
          id="bio"
          placeholder="Write a brief description about yourself..."
          value={data.bio}
          onChange={(e) => handleInputChange('bio', e.target.value.slice(0, 300))}
          disabled={isLoading}
          maxLength={300}
          className="text-sm min-h-24"
        />
        <p className="text-xs text-gray-500">{data.bio.length}/300 characters</p>
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide">Social Links</Label>

        <div className="space-y-1.5">
          <Label htmlFor="linkedin" className="text-xs text-gray-600">LinkedIn URL</Label>
          <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/johndoe"
            value={data.linkedin_url}
            onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
            disabled={isLoading} className="text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="github" className="text-xs text-gray-600">GitHub URL</Label>
          <Input id="github" type="url" placeholder="https://github.com/johndoe"
            value={data.github_url}
            onChange={(e) => handleInputChange('github_url', e.target.value)}
            disabled={isLoading} className="text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website" className="text-xs text-gray-600">Website / Portfolio URL</Label>
          <Input id="website" type="url" placeholder="https://johndoe.com"
            value={data.website_url}
            onChange={(e) => handleInputChange('website_url', e.target.value)}
            disabled={isLoading} className="text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="twitter" className="text-xs text-gray-600">Twitter/X URL</Label>
          <Input id="twitter" type="url" placeholder="https://twitter.com/johndoe"
            value={data.twitter_url}
            onChange={(e) => handleInputChange('twitter_url', e.target.value)}
            disabled={isLoading} className="text-sm" />
        </div>
      </div>
    </div>
  );
};