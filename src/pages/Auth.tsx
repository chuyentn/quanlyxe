import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";

export default function Auth() {
    const { session } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Login states
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register states
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerName, setRegisterName] = useState("");

    useEffect(() => {
        if (session) {
            navigate("/");
        }
    }, [session, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;

            toast({
                title: "Đăng nhập thành công",
                description: "Chào mừng bạn quay trở lại!",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
            toast({
                title: "Đăng nhập thất bại",
                description: message === "Invalid login credentials"
                    ? "Email hoặc mật khẩu không chính xác."
                    : message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: registerEmail,
                password: registerPassword,
                options: {
                    data: {
                        full_name: registerName,
                    },
                },
            });

            if (error) throw error;

            if (data.session) {
                toast({
                    title: "Đăng ký thành công",
                    description: "Tài khoản đã được tạo và đăng nhập.",
                });
            } else if (data.user) {
                toast({
                    title: "Đăng ký thành công",
                    description: "Vui lòng kiểm tra email để xác thực tài khoản.",
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
            toast({
                title: "Đăng ký thất bại",
                description: message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Truck className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-primary">Công ty cổ phần Sao Vàng</CardTitle>
                    <CardDescription>
                        Hệ thống quản lý đội xe chuyên nghiệp
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                            <TabsTrigger value="register">Đăng ký</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mật khẩu</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Đang xử lý..." : "Đăng nhập"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-name">Họ và tên</Label>
                                    <Input
                                        id="register-name"
                                        type="text"
                                        placeholder="Nguyễn Văn A"
                                        value={registerName}
                                        onChange={(e) => setRegisterName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">Email</Label>
                                    <Input
                                        id="register-email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={registerEmail}
                                        onChange={(e) => setRegisterEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Mật khẩu</Label>
                                    <Input
                                        id="register-password"
                                        type="password"
                                        value={registerPassword}
                                        onChange={(e) => setRegisterPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
