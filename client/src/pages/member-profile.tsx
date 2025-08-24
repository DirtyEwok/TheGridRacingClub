import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { User, MapPin, Car, Calendar, Trophy, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import type { Member } from "@shared/schema";

function MemberProfile() {
  const { id } = useParams();

  const { data: member, isLoading } = useQuery({
    queryKey: ["/api/members/by-id", id],
    queryFn: async () => {
      const response = await fetch(`/api/members/${id}`);
      if (!response.ok) throw new Error("Failed to fetch member");
      return response.json();
    },
    enabled: !!id,
  });

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
            <div className="text-white">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Member Not Found</h1>
            <p className="text-gray-400">The requested member profile could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-racing-green" />
            <h1 className="text-3xl font-bold text-white">Member Profile</h1>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Profile Header */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {member.profileImageUrl ? (
                    <img
                      src={member.profileImageUrl}
                      alt={member.displayName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-racing-green"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-racing-green rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-white text-2xl mb-2">
                    {member.displayName}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-lg mb-3">
                    {member.gamertag}
                  </CardDescription>
                  <div className="flex items-center gap-4">
                    <Badge className={getExperienceBadgeColor(member.experienceLevel)}>
                      {member.experienceLevel}
                    </Badge>
                    {member.carNumber && (
                      <Badge variant="outline" className="text-racing-green border-racing-green">
                        #{member.carNumber}
                      </Badge>
                    )}
                    {(member.streamLink || member.streamLink2) && (
                      <div className="flex items-center gap-2">
                        {member.streamLink && (
                          <a 
                            href={member.streamLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-racing-green hover:text-green-400 inline-flex items-center gap-1 text-sm"
                          >
                            <Video className="w-4 h-4" />
                            Stream 1
                          </a>
                        )}
                        {member.streamLink2 && (
                          <a 
                            href={member.streamLink2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-racing-green hover:text-green-400 inline-flex items-center gap-1 text-sm"
                          >
                            <Video className="w-4 h-4" />
                            Stream 2
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Details */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Bio */}
                {member.bio && (
                  <div>
                    <h3 className="text-white font-semibold mb-2">Bio</h3>
                    <p className="text-gray-300">{member.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Favorite Track */}
                  {member.favoriteTrack && (
                    <div>
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Favorite Track
                      </h3>
                      <p className="text-gray-300">{member.favoriteTrack}</p>
                    </div>
                  )}

                  {/* Favorite Car Class */}
                  {member.favoriteCarClass && (
                    <div>
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Favorite Car Class
                      </h3>
                      <p className="text-gray-300">{member.favoriteCarClass}</p>
                    </div>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </h3>
                  <p className="text-gray-300">{formatDate(member.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Race History */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-racing-green" />
                Race History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                Race history will be displayed here once available.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MemberProfile;