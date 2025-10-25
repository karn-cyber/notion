import { ArrowLeftCircle } from "lucide-react";

export default function Home() {
    return (
        <main className="flex space-x-2 items-center animate-pulse">
            <ArrowLeftCircle className="w-12 h-12 text-gray-400"/>
            <h1 className="text-gray-400 font-bold">Get Started with creating a New Document</h1>
        </main>
    )
}