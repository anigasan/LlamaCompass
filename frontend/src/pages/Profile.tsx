import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Bell, 
  Shield,
  MapPin,
  Route,
  Star,
  Award,
  ChevronRight,
  LogOut
} from 'lucide-react';

export function Profile() {
  const achievements = [
    { name: 'Navigator', description: '100+ routes completed', icon: '🧭' },
    { name: 'Efficient', description: '90%+ route efficiency', icon: '⚡' },
    { name: 'Explorer', description: '50+ new locations', icon: '🗺️' },
    { name: 'Consistent', description: '30-day streak', icon: '🔥' }
  ];

  const stats = [
    { label: 'Total Routes', value: '247', icon: Route },
    { label: 'Locations Saved', value: '18', icon: MapPin },
    { label: 'Avg Rating', value: '4.8', icon: Star },
    { label: 'Achievements', value: '12', icon: Award }
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark-blue-header mb-2">Profile</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Header */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold dark-blue-header">Alex Johnson</h3>
              <p className="text-muted-foreground">alex.johnson@email.com</p>
              <Badge className="mt-2 bg-primary/10 text-primary">Premium Member</Badge>
            </div>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-4 text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold dark-blue-header">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <p className="font-medium text-sm dark-blue-header">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Menu */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm dark-blue-header">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm dark-blue-header">Privacy & Security</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm dark-blue-header">Location Preferences</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <Route className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm dark-blue-header">Route Preferences</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="shadow-sm border-destructive/20">
        <CardContent className="p-4">
          <Button variant="destructive" className="w-full" size="lg">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}