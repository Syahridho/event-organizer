// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { formatDateTime } from "@/utils/formatDate";
// import { formatRupiah } from "@/Utils/formatRupiah";
// import { Head, usePage } from "@inertiajs/react";
// import { ArrowLeft } from "lucide-react";
// import { useState } from "react";

// const breadcrumbs = [
//     {
//         title: "Dashboard",
//         href: "/dashboard",
//     },
//     {
//         title: "Event",
//         href: "/dashboard/event",
//     },
//     {
//         title: "Detail",
//         href: "/dashboard/event",
//     },
// ];

// const EventDetail = () => {
//     const { event, ziggy } = usePage().props;

//     const [isImageLoaded, setIsImageLoaded] = useState(false);
//     const [imageLoaded, setImageLoaded] = useState({});

//     const getStatusColor = (status) => {
//         switch (status) {
//             case "Pending":
//                 return "border border-yellow-400 text-yellow-500";
//             case "Confirmed":
//                 return "border border-green-400 text-green-500";
//             case "Cancelled":
//                 return "border border-red-400 text-red-500";
//             case "Completed":
//                 return "border border-blue-400 text-blue-500";
//             default:
//                 return "border border-slate-400 text-slate-500";
//         }
//     };

//     console.log(usePage().props);

//     return (
//         <AppLayout breadcrumbs={breadcrumbs}>
//             <Head title="Dashboard" />
//             <div className="grid gap-4 p-4">
//                 <Button
//                     variant={"link"}
//                     onClick={() => window.history.back()}
//                     className="flex w-fit cursor-pointer items-center !px-0"
//                 >
//                     <ArrowLeft />
//                     Kembali
//                 </Button>
//                 <div className="flex items-center gap-4 pb-4">
//                     {!isImageLoaded && (
//                         <Skeleton className="absolute inset-0 h-full w-full rounded-xl" />
//                     )}
//                     <img
//                         src={
//                             event.thumbnail.includes("randoms")
//                                 ? `${ziggy.url}/storage${event.thumbnail}`
//                                 : `${ziggy.url}/storage/thumbnails/${event.thumbnail}`
//                         }
//                         alt={event.title}
//                         className={`h-36 max-w-36 rounded border object-cover shadow-sm transition-opacity duration-300 ${
//                             isImageLoaded ? "opacity-100" : "opacity-0"
//                         }`}
//                         onLoad={() => setIsImageLoaded(true)}
//                     />
//                     <div className="space-y-1">
//                         <h1 className="text-primary text-3xl font-medium">
//                             {event.title}
//                         </h1>
//                         <p className="text-sm text-gray-500">
//                             {event.location}
//                         </p>
//                         <div className="flex gap-2">
//                             <Badge
//                                 variant={"outline"}
//                                 className={getStatusColor(event.status)}
//                             >
//                                 {event.status}
//                             </Badge>
//                             <Badge
//                                 variant="outline"
//                                 className="text-muted-foreground"
//                             >
//                                 {event.event_mode}
//                             </Badge>
//                         </div>
//                     </div>
//                 </div>
//                 <Separator className="my-4" />
//                 <div className="mb-12">
//                     <Tabs defaultValue="description">
//                         <TabsList className="mb-6">
//                             <TabsTrigger value="description">
//                                 Deskripsi
//                             </TabsTrigger>
//                             <TabsTrigger value="ticket">Tiket</TabsTrigger>
//                         </TabsList>
//                         <TabsContent value="description">
//                             <div className="my-4">
//                                 <h1 className="text-primary text-xl font-medium">
//                                     Deskripsi
//                                 </h1>
//                                 <p>{event.description ?? "-"}</p>
//                             </div>
//                             <Separator className="my-4" />

//                             <div className="my-4">
//                                 <h1 className="text-primary mb-4 text-xl font-semibold">
//                                     Jadwal Event
//                                 </h1>
//                                 <div className="flex flex-col gap-2">
//                                     <div className="flex gap-2">
//                                         <span className="w-20 font-semibold">
//                                             Mulai
//                                         </span>
//                                         <span className="text-muted-foreground">
//                                             :{" "}
//                                             {formatDateTime(
//                                                 event.event_date_start
//                                             )}
//                                         </span>
//                                     </div>
//                                     <div className="flex gap-2">
//                                         <span className="w-20 font-semibold">
//                                             Selesai
//                                         </span>
//                                         <span className="text-muted-foreground">
//                                             :{" "}
//                                             {event.event_date_end ==
//                                             event.event_date_start
//                                                 ? "Sampai Selesai"
//                                                 : formatDateTime(
//                                                       event.event_date_end
//                                                   )}
//                                         </span>
//                                     </div>
//                                 </div>
//                             </div>

//                             <Separator className="my-4" />
//                             <div>
//                                 <h1 className="text-primary mb-6 text-xl font-medium">
//                                     Pembicara
//                                 </h1>
//                                 <div className="flex gap-4">
//                                     {event?.speakers?.length > 0
//                                         ? event.speakers.map((speaker) => (
//                                               <div
//                                                   key={speaker.id}
//                                                   className="relative flex flex-col items-center justify-center text-center"
//                                               >
//                                                   {!imageLoaded[speaker.id] && (
//                                                       <Skeleton className="absolute inset-0 h-24 w-24 rounded-full" />
//                                                   )}
//                                                   <img
//                                                       src={`${ziggy.url}/storage/speakers/${speaker.picture}`}
//                                                       alt={speaker.name}
//                                                       className={`h-24 w-24 rounded-full border object-cover shadow-md transition-opacity duration-300 ${
//                                                           imageLoaded[
//                                                               speaker.id
//                                                           ]
//                                                               ? "opacity-100"
//                                                               : "opacity-0"
//                                                       }`}
//                                                       onLoad={() =>
//                                                           setImageLoaded(
//                                                               (prev) => ({
//                                                                   ...prev,
//                                                                   [speaker.id]: true,
//                                                               })
//                                                           )
//                                                       }
//                                                   />
//                                                   <div className="mt-2 space-y-0.5 text-center">
//                                                       <h1 className="truncate text-sm font-medium">
//                                                           {speaker.name}
//                                                       </h1>
//                                                       <p className="text-xs text-gray-500">
//                                                           {speaker.description}
//                                                       </p>
//                                                   </div>
//                                               </div>
//                                           ))
//                                         : "-"}
//                                 </div>
//                             </div>
//                         </TabsContent>
//                         <TabsContent value="ticket">
//                             <h1 className="text-primary mb-4 text-xl font-semibold">
//                                 Jadwal Penjualan
//                             </h1>
//                             <div className="flex flex-col gap-2">
//                                 <div className="flex gap-2">
//                                     <span className="w-20 font-semibold">
//                                         Mulai
//                                     </span>
//                                     <span className="text-muted-foreground">
//                                         :{" "}
//                                         {formatDateTime(
//                                             event.ticket_date_start
//                                         )}
//                                     </span>
//                                 </div>
//                                 <div className="flex gap-2">
//                                     <span className="w-20 font-semibold">
//                                         Selesai
//                                     </span>
//                                     <span className="text-muted-foreground">
//                                         :{" "}
//                                         {event.ticket_date_end ==
//                                         event.event_date_start
//                                             ? "Sampai Acara Dimulai"
//                                             : formatDateTime(
//                                                   event.event_date_end
//                                               )}
//                                     </span>
//                                 </div>
//                             </div>

//                             <div className="my-6 flex">
//                                 {event?.tickets?.length > 0 ? (
//                                     event.tickets.map((ticket) => (
//                                         <div className="bg-muted relative w-fit rounded border border-dashed border-gray-400 px-12 py-6 shadow-sm">
//                                             {/* Sudut kiri atas */}
//                                             <div className="absolute -top-3 -left-3 h-6 w-6 rounded-full border-4 border-white bg-white" />
//                                             {/* Sudut kanan atas */}
//                                             <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full border-4 border-white bg-white" />
//                                             {/* Sudut kiri bawah */}
//                                             <div className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full border-4 border-white bg-white" />
//                                             {/* Sudut kanan bawah */}
//                                             <div className="absolute -right-3 -bottom-3 h-6 w-6 rounded-full border-4 border-white bg-white" />

//                                             <h1 className="text-xl font-semibold text-gray-700">
//                                                 {ticket.ticket_name}
//                                             </h1>
//                                             <p className="text-sm">
//                                                 Harga : Rp.{" "}
//                                                 {formatRupiah(
//                                                     ticket.ticket_price
//                                                 )}
//                                             </p>
//                                             <p className="text-sm">
//                                                 Kuota : {ticket.ticket_quota}
//                                             </p>
//                                         </div>
//                                     ))
//                                 ) : (
//                                     <div className="bg-muted relative w-fit rounded border border-dashed border-gray-400 px-12 py-6 shadow-sm">
//                                         {/* Sudut kiri atas */}
//                                         <div className="absolute -top-3 -left-3 h-6 w-6 rounded-full border-4 border-white bg-white" />
//                                         {/* Sudut kanan atas */}
//                                         <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full border-4 border-white bg-white" />
//                                         {/* Sudut kiri bawah */}
//                                         <div className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full border-4 border-white bg-white" />
//                                         {/* Sudut kanan bawah */}
//                                         <div className="absolute -right-3 -bottom-3 h-6 w-6 rounded-full border-4 border-white bg-white" />

//                                         <h1 className="text-xl font-semibold text-gray-700">
//                                             Free
//                                         </h1>
//                                     </div>
//                                 )}
//                             </div>
//                         </TabsContent>
//                     </Tabs>
//                 </div>
//             </div>
//         </AppLayout>
//     );
// };

// export default EventDetail;
