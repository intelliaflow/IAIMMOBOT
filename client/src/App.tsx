import { Switch, Route } from "wouter";
import { Home } from "./pages/Home";
import { PropertyDetail } from "./pages/PropertyDetail";
import { AgencyDashboard } from "./pages/AgencyDashboard";
import { SaleProperties } from "./pages/SaleProperties";
import { RentProperties } from "./pages/RentProperties";
import { NavBar } from "./components/NavBar";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/properties/sale" component={SaleProperties} />
        <Route path="/properties/rent" component={RentProperties} />
        <Route path="/property/:id" component={PropertyDetail} />
        <Route path="/agency/dashboard" component={AgencyDashboard} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
