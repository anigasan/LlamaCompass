import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation as NavigationIcon, 
  Route, 
  Clock,
  Compass,
  Target,
  Map,
  Zap
} from 'lucide-react';

export function Navigation() {
  const [activeRoute, setActiveRoute] = useState<string | null>(null);

  const recentRoutes = [
    {
      id: '1',
      destination: 'Downtown Office',
      distance: '2.4 km',
      duration: '8 min',
      status: 'completed'
    },
    {
      id: '2',
      destination: 'Shopping Mall',
      distance: '5.1 km',
      duration: '15 min',
      status: 'active'
    },
    {
      id: '3',
      destination: 'Airport Terminal',
      distance: '12.8 km',
      duration: '25 min',
      status: 'planned'
    }
  ];

  const quickDestinations = [
    { name: 'Home', icon: '🏠', distance: '3.2 km' },
    { name: 'Work', icon: '🏢', distance: '2.4 km' },
    { name: 'Gym', icon: '💪', distance: '1.8 km' },
    { name: 'Store', icon: '🛒', distance: '0.9 km' }
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark-blue-header mb-2">Navigation</h2>
        <p className="text-muted-foreground">Plan your routes and navigate efficiently</p>
      </div>

      {/* Current Location */}
      <Card className="shadow-sm border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Compass className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold dark-blue-header">Current Location</h3>
              <p className="text-sm text-muted-foreground">123 Main Street, Downtown</p>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <NavigationIcon className="w-4 h-4 mr-1" />
              Navigate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Destinations */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Quick Destinations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickDestinations.map((dest, index) => (
              <button
                key={index}
                className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-2xl">{dest.icon}</span>
                <div className="text-left">
                  <p className="font-medium text-sm dark-blue-header">{dest.name}</p>
                  <p className="text-xs text-muted-foreground">{dest.distance}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Routes */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Route className="w-5 h-5" />
            <span>Recent Routes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm dark-blue-header">{route.destination}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{route.distance}</span>
                      <span>•</span>
                      <span>{route.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={route.status === 'active' ? 'default' : 'secondary'}
                    className={route.status === 'active' ? 'bg-primary' : ''}
                  >
                    {route.status}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <NavigationIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tools */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Map className="w-5 h-5" />
            <span>Navigation Tools</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
              <Route className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium dark-blue-header">Route Planner</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
              <Zap className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium dark-blue-header">Fast Route</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
              <Clock className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium dark-blue-header">Schedule Trip</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
              <MapPin className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium dark-blue-header">Save Location</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}