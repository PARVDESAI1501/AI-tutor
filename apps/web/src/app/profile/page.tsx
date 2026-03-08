import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, BookOpen, MessageSquare, Sparkles } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: sourceCount } = await supabase.from("sources").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { count: convCount } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { count: materialCount } = await supabase.from("study_materials").select("id", { count: "exact", head: true }).eq("user_id", user.id);

  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const provider = user.app_metadata?.provider || "email";
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Profile</h1>

        {/* Profile Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary to-primary/70" />
          <CardContent className="relative pb-6 px-6">
            <div className="flex items-end gap-4 -mt-8">
              <div className="rounded-full bg-background border-4 border-background shadow-lg p-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold">{fullName}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />{user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Stats */}
        <h2 className="text-lg font-semibold mb-4">Your Learning</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 text-center">
              <BookOpen className="h-7 w-7 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{sourceCount || 0}</p>
              <p className="text-xs text-muted-foreground">Sources</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <MessageSquare className="h-7 w-7 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{convCount || 0}</p>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Sparkles className="h-7 w-7 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{materialCount || 0}</p>
              <p className="text-xs text-muted-foreground">Materials</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <Card>
          <CardContent className="p-0 divide-y">
            <div className="flex justify-between items-center p-4">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm text-muted-foreground">Sign-in Method</span>
              <Badge variant="outline" className="capitalize">{provider}</Badge>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Member Since</span>
              <span className="text-sm">{joinDate}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
