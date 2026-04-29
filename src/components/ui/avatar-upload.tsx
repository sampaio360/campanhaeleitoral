import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentUrl?: string | null;
  fallback: string;
  onUploaded: (url: string) => void;
  folder: string; // e.g. "profiles" or "supporters"
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

export function AvatarUpload({ currentUrl, fallback, onUploaded, folder, size = "lg" }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 5MB.", variant: "destructive" });
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const ext = file.name.split(".").pop();
      // Path must start with auth.uid() to satisfy storage RLS policies
      const path = `${user.id}/${folder}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      onUploaded(urlData.publicUrl);
      toast({ title: "Foto atualizada!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="relative group inline-block">
      <Avatar className={`${sizeMap[size]} border-2 border-border`}>
        <AvatarImage src={displayUrl || ""} />
        <AvatarFallback className="text-lg bg-primary text-primary-foreground">
          {fallback}
        </AvatarFallback>
      </Avatar>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-md opacity-90 group-hover:opacity-100 transition-opacity"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
