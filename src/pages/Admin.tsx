import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminNotifications from "@/components/admin/AdminNotifications";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-foreground">Painel Admin</h1>
      </div>

      <div className="p-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary rounded-xl h-10">
            <TabsTrigger value="users" className="rounded-lg text-xs">Usuários</TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg text-xs">Eventos</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg text-xs">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="events" className="mt-4">
            <AdminEvents />
          </TabsContent>
          <TabsContent value="notifications" className="mt-4">
            <AdminNotifications />
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Admin;
