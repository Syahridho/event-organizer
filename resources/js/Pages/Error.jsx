import React from "react";
import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button.jsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({ status, message }) {
    const getErrorDetails = (statusCode) => {
        const errorMap = {
            404: {
                title: "Page Not Found",
                description:
                    "The page you're looking for doesn't exist or has been moved.",
                icon: AlertTriangle,
            },
            403: {
                title: "Access Forbidden",
                description:
                    "You don't have permission to access this resource.",
                icon: AlertTriangle,
            },
            401: {
                title: "Unauthorized",
                description: "Please log in to access this page.",
                icon: AlertTriangle,
            },
            500: {
                title: "Server Error",
                description:
                    "Something went wrong on our end. Please try again later.",
                icon: AlertTriangle,
            },
            503: {
                title: "Service Unavailable",
                description:
                    "The service is temporarily unavailable. Please try again later.",
                icon: RefreshCw,
            },
        };

        return (
            errorMap[statusCode] || {
                title: "An Error Occurred",
                description: message || "Something unexpected happened.",
                icon: AlertTriangle,
            }
        );
    };

    const errorDetails = getErrorDetails(status);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <errorDetails.icon className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-destructive">
                        {status} - {errorDetails.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {errorDetails.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="text-sm text-muted-foreground">
                                <strong>Debug Info:</strong>
                            </p>
                            <p className="text-xs font-mono">
                                Status: {status}
                                <br />
                                Message: {message}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
