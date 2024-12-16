import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

export function NavBar() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary">IAImmo</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/acheter" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                Acheter
              </Link>
              <Link href="/louer" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                Louer
              </Link>
              <Link href="/agency/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                Agences
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost">
              <UserCircle className="h-5 w-5 mr-2" />
              Connexion
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
