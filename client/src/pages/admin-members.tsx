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

  const { data: pendingMembers, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-members"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pending-members", {
        headers: { 'Authorization': 'admin-access' }
      });
      if (!response.ok) throw new Error("Failed to fetch pending members");
      return response.json();
    },
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

  if (isLoading) {
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
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Member Approval</h1>
          </div>
          <p className="text-gray-400">Review and approve new member registrations</p>
        </div>

        {!pendingMembers || pendingMembers.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12">
              <div className="text-center">
                <UserCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Pending Approvals</h3>
                <p className="text-gray-400">All member registrations have been reviewed.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingMembers.map((member: Member) => (
              <Card key={member.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        {member.displayName}
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          Pending
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminMemberApproval;