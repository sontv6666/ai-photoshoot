import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Key, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { initializeGemini } from "@/services/geminiService";

export default function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Load saved API key from localStorage
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      setErrorMessage("Vui lòng nhập API key");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    setErrorMessage("");

    try {
      // Validate API key by initializing Gemini
      initializeGemini(geminiApiKey.trim());
      
      // Save to localStorage
      localStorage.setItem("gemini_api_key", geminiApiKey.trim());
      
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving API key:", error);
      setErrorMessage("API key không hợp lệ hoặc có lỗi xảy ra");
      setSaveStatus("error");
    }
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem("gemini_api_key");
    setGeminiApiKey("");
    setSaveStatus("success");
    setTimeout(() => {
      setSaveStatus("idle");
    }, 2000);
  };

  const maskedApiKey = geminiApiKey
    ? `${geminiApiKey.substring(0, 8)}...${geminiApiKey.substring(geminiApiKey.length - 4)}`
    : "";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl bg-background">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Account Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Email Notifications
                </h3>
                <p className="text-sm">
                  Receive email updates about your projects
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm">
                  Add an extra layer of security to your account
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Password
                </h3>
                <p className="text-sm">
                  Update your password regularly for security
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Save Changes</Button>
          </CardFooter>
        </Card>

        {/* Privacy Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control your data and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Profile Visibility
                </h3>
                <p className="text-sm">Control who can see your profile</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  Public
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Data Usage
                </h3>
                <p className="text-sm">
                  How we use your data to improve our services
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Update Privacy Settings</Button>
          </CardFooter>
        </Card>

        {/* API Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Cấu hình API key cho Gemini AI để sử dụng tính năng tạo ảnh thời trang. 
              Bạn có thể lấy API key miễn phí từ{" "}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Google AI Studio
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="gemini-api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Nhập Gemini API key của bạn"
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value);
                      setSaveStatus("idle");
                      setErrorMessage("");
                    }}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {saveStatus === "success" && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    API key đã được lưu thành công!
                  </AlertDescription>
                </Alert>
              )}

              {geminiApiKey && !showApiKey && (
                <p className="text-xs text-muted-foreground">
                  API key hiện tại: {maskedApiKey}
                </p>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Lấy API key của bạn tại:{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  API key sẽ được lưu trữ cục bộ trên trình duyệt của bạn và chỉ được sử dụng
                  để gọi API Gemini.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={handleSaveApiKey}
              disabled={saveStatus === "saving"}
              className="flex-1"
            >
              {saveStatus === "saving" ? "Đang lưu..." : "Lưu API Key"}
            </Button>
            {geminiApiKey && (
              <Button
                variant="outline"
                onClick={handleRemoveApiKey}
                disabled={saveStatus === "saving"}
              >
                Xóa
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Appearance Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Theme
                </h3>
                <p className="text-sm">Choose between light and dark mode</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  Light
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Language
                </h3>
                <p className="text-sm">Select your preferred language</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  English
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Apply Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
