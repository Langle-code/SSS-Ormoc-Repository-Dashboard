import { useState, useCallback } from "react";
import { Layout } from "@/components/layout";
import {
  useListEmployers,
  useGetUploadUrl,
  useUploadDocument,
  getListDocumentsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload as UploadIcon } from "lucide-react";

export default function UploadForm() {
  const [employerId, setEmployerId] = useState("");
  const [formName, setFormName] = useState("");
  const [formType] = useState("R1/R1A");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employers } = useListEmployers();
  const getUploadUrl = useGetUploadUrl();
  const uploadDocument = useUploadDocument();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Only PDF files are accepted", variant: "destructive" });
        return;
      }
      if (f.size > 50 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 50MB", variant: "destructive" });
        return;
      }
      setFile(f);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerId || !file) {
      toast({ title: "Missing fields", description: "Please select an employer and a PDF file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const urlResponse = await getUploadUrl.mutateAsync({
        data: { fileName: file.name, contentType: file.type },
      });

      const uploadRes = await fetch(urlResponse.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      await uploadDocument.mutateAsync({
        data: {
          formName: formName || file.name,
          formType: formType as "R1/R1A",
          employerId: parseInt(employerId, 10),
          fileName: file.name,
          fileUrl: urlResponse.fileUrl,
        },
      });

      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      toast({ title: "Document uploaded successfully" });
      setFormName("");
      setFile(null);
      setEmployerId("");
    } catch {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upload Scanned Form</h2>
          <p className="text-muted-foreground">Upload R-1 or R-1A PDF documents</p>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Select Employer</Label>
                <Select value={employerId} onValueChange={setEmployerId}>
                  <SelectTrigger data-testid="select-employer">
                    <SelectValue placeholder="Choose an employer..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {employers?.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.name} ({emp.employerId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>R1/R1A Form</Label>
                <RadioGroup defaultValue="R1/R1A" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="R1/R1A" id="r1r1a" />
                    <Label htmlFor="r1r1a">R1/R1A</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formName">Form Name (optional)</Label>
                <Input
                  id="formName"
                  placeholder="e.g. R1-2024-Q1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="input-form-name"
                />
              </div>

              <div className="space-y-2">
                <Label>PDF File</Label>
                <label
                  className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  htmlFor="pdf-upload"
                  data-testid="area-file-upload"
                >
                  <UploadIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  {file ? (
                    <p className="text-sm font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Click to select PDF file</p>
                      <p className="text-xs text-muted-foreground">PDF files only, max 50MB</p>
                    </>
                  )}
                </label>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploading || !employerId || !file}
                data-testid="button-upload-form"
              >
                <UploadIcon className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Form"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
