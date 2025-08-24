import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, UserX, Crown, Calendar, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import type { Member } from "@shared/schema";

function AdminMemberApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [viewMode, setViewMode] = useState<"pending" | "all">("pending");

  const { data: pendingMembers, isLoading: isLoadingPending } = useQuery({
    queryKey: ["/api/admin/pending-members"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pending-members", {
        headers: { 'Authorization': 'admin-access' }
      });
      if (!response.ok) throw new Error("Failed to fetch pending members");
      return response.json();
    },
  });

  const { data: allMembers, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/members"],
    queryFn: async () => {
      const response = await fetch("/api/members");
      if (!response.ok) throw new Error("Failed to fetch all members");
      return response.json();
    },
    enabled: viewMode === "all"
  });

  const approveMutation = useMutation({
    mutationFn: async ({ memberId, approved, rejectionReason }: { 
      memberId: string; 
      approved: boolean; 
      rejectionReason?: string; 
    }) => {
      const response = await fetch("/api/admin/approve-member", {
        method: "POST",
        headers: { 
          'Authorization': 'admin-access',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memberId, approved, rejectionReason }),
      });
      if (!response.ok) throw new Error("Failed to approve member");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      
      toast({
        title: variables.approved ? "Member Approved" : "Member Rejected",
        description: variables.approved 
          ? `${data.gamertag} has been approved and can now access races.`
          : `${data.gamertag} has been rejected.`,
      });
      
      setRejectionReason("");
      setSelectedMember(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to process member approval: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (member: Member) => {
    approveMutation.mutate({ 
      memberId: member.id, 
      approved: true 
    });
  };

  const handleReject = (member: Member) => {
    approveMutation.mutate({ 
      memberId: member.id, 
      approved: false, 
      rejectionReason 
    });
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-blue-100 text-blue-800";
      case "Advanced": return "bg-purple-100 text-purple-800";
      case "Professional": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoadingPending || (viewMode === "all" && isLoadingAll)) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading pending members...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-orange-500" />
                <h1 className="text-3xl font-bold text-white">Member Management</h1>
              </div>
              <p className="text-gray-400">
                {viewMode === "pending" ? "Review and approve new member registrations" : "View and manage all club members"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode("pending")}
                variant={viewMode === "pending" ? "default" : "outline"}
                className={viewMode === "pending" ? "bg-orange-600 hover:bg-orange-700" : "border-gray-600 text-white hover:bg-gray-800"}
              >
                Pending ({pendingMembers?.length || 0})
              </Button>
              <Button
                onClick={() => setViewMode("all")}
                variant={viewMode === "all" ? "default" : "outline"}
                className={viewMode === "all" ? "bg-orange-600 hover:bg-orange-700" : "border-gray-600 text-white hover:bg-gray-800"}
              >
                All Members
              </Button>
            </div>
          </div>
        </div>

        {(() => {
          const displayMembers = viewMode === "pending" ? pendingMembers : allMembers;
          const isEmpty = !displayMembers || displayMembers.length === 0;
          
          return isEmpty ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <UserCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {viewMode === "pending" ? "No Pending Approvals" : "No Members Found"}
                  </h3>
                  <p className="text-gray-400">
                    {viewMode === "pending" 
                      ? "All member registrations have been reviewed." 
                      : "No members have been registered yet."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {displayMembers.map((member: Member) => (
              <Card key={member.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        {member.displayName}
                        <Badge 
                          variant="outline" 
                          className={
                            member.status === "pending" 
                              ? "text-orange-500 border-orange-500"
                              : member.status === "approved"
                              ? "text-green-500 border-green-500"
                              : "text-red-500 border-red-500"
                          }
                        >
                          {member.status === "pending" ? "Pending" : 
                           member.status === "approved" ? "Approved" : "Rejected"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Gamertag: {member.gamertag}
                      </CardDescription>
                    </div>
                    <Badge className={getExperienceBadgeColor(member.experienceLevel)}>
                      {member.experienceLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Registered: {formatDate(member.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => window.location.href = `/members/${member.id}/profile`}
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-800"
                      data-testid={`button-view-profile-${member.id}`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                    
                    {member.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleApprove(member)}
                          disabled={approveMutation.isPending}
                          className="bg-racing-green hover:bg-racing-green/80 text-white"
                          data-testid={`button-approve-${member.id}`}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              disabled={approveMutation.isPending}
                              onClick={() => setSelectedMember(member)}
                              data-testid={`button-reject-${member.id}`}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-800">
                            <DialogHeader>
                              <DialogTitle className="text-white">Reject Member</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Are you sure you want to reject {selectedMember?.displayName}? 
                                Please provide a reason for rejection.
                              </DialogDescription>
                            </DialogHeader>
                            <Textarea
                              placeholder="Reason for rejection (optional)"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                              data-testid="textarea-rejection-reason"
                            />
                            <DialogFooter>
                              <Button
                                onClick={() => selectedMember && handleReject(selectedMember)}
                                disabled={approveMutation.isPending}
                                variant="destructive"
                                data-testid="button-confirm-reject"
                              >
                                Confirm Rejection
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default AdminMemberApproval;