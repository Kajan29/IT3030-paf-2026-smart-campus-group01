import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { User, Mail, Briefcase, Shield, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const ProfilePage = () => {
  const { user } = useAuth();

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500 text-white";
      case "ACADEMIC_STAFF":
        return "bg-blue-500 text-white";
      case "NON_ACADEMIC_STAFF":
        return "bg-green-500 text-white";
      case "STUDENT":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">View and manage your account information</p>
          </div>

          <div className="grid gap-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src="" alt={user?.firstName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h2>
                      <Badge className={`mt-2 ${getRoleBadgeColor(user?.role || '')}`}>
                        {formatRole(user?.role || 'User')}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <Mail className="h-5 w-5 text-primary" />
                        <span>{user?.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <span>{formatRole(user?.role || 'User')}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className={user?.isVerified ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                          {user?.isVerified ? "Verified Account" : "Pending Verification"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Current status of your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-gray-900">Email Verification</p>
                        <p className="text-sm text-gray-500">Your email verification status</p>
                      </div>
                    </div>
                    <Badge variant={user?.isVerified ? "default" : "secondary"}>
                      {user?.isVerified ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-gray-900">Account Type</p>
                        <p className="text-sm text-gray-500">Your current role and permissions</p>
                      </div>
                    </div>
                    <Badge className={getRoleBadgeColor(user?.role || '')}>
                      {formatRole(user?.role || 'User')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
