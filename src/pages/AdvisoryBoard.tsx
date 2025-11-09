import { useState } from "react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "/Users/benjaminwilliams/bill2-monitor/src/components/Header.tsx";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Shield, 
  Mail, 
  Twitter, 
  Linkedin,
  Calendar,
  FileText,
  Gavel,
  Award,
  Eye,
  BookOpen,
  Scale
} from "lucide-react";
import { 
  advisoryBoardMembers, 
  governanceStructure, 
  platformPrinciples, 
  contactInfo,
  boardDecisions,
  type AdvisoryBoardMember 
} from "@/data/advisoryBoard";
import { SocialMetaTags } from "@/components/v3/SocialMetaTags";

const AdvisoryBoard = () => {
  const [selectedMember, setSelectedMember] = useState<AdvisoryBoardMember | null>(null);
  const chair = advisoryBoardMembers.find(member => member.role === 'chair');
  const members = advisoryBoardMembers.filter(member => member.role === 'member');
  const externalMembers = advisoryBoardMembers.filter(member => member.role === 'external');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'chair':
        return <Badge className="bg-gold-500 text-white">Chair</Badge>;
      case 'member':
        return <Badge variant="secondary">Board Member</Badge>;
      case 'external':
        return <Badge variant="outline">External Advisor</Badge>;
      default:
        return null;
    }
  };

  const MemberCard = ({ member }: { member: AdvisoryBoardMember }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedMember(member)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{member.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{member.title}</p>
            <p className="text-sm font-medium">{member.affiliation}</p>
          </div>
          {getRoleBadge(member.role)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Expertise
            </h4>
            <div className="flex flex-wrap gap-2">
              {member.expertise.map((area, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-3">
            {member.bio}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Member since {new Date(member.memberSince).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </div>
          
          {member.contact && (
            <div className="flex items-center gap-2">
              {member.contact.email && (
                <a 
                  href={`mailto:${member.contact.email}`} 
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {member.contact.twitter && (
                <a 
                  href={`https://twitter.com/${member.contact.twitter.replace('@', '')}`} 
                  className="text-sm text-primary hover:underline"
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {member.contact.linkedin && (
                <a 
                  href={`https://linkedin.com/in/${member.contact.linkedin}`} 
                  className="text-sm text-primary hover:underline"
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <SocialMetaTags 
        title="Advisory Board - Civic Data Platform"
        description="Meet our independent advisory board ensuring methodological rigor and platform neutrality"
      />
      
      <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
        <BackgroundFX />
        <Header />
        <Banner />

        <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-primary" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Advisory Board
              </h1>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our independent advisory board ensures methodological rigor, platform neutrality, and the highest standards of data integrity and privacy protection.
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Board Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{advisoryBoardMembers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Independent experts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expertise Areas</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {[...new Set(advisoryBoardMembers.flatMap(m => m.expertise))].length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Specializations covered
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Institutions</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {[...new Set(advisoryBoardMembers.map(m => m.affiliation))].length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leading universities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="members" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Board Members
              </TabsTrigger>
              <TabsTrigger value="governance" className="flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                Governance
              </TabsTrigger>
              <TabsTrigger value="principles" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Principles
              </TabsTrigger>
              <TabsTrigger value="decisions" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Decisions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-6">
              {/* Chair Section */}
              {chair && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Award className="w-6 h-6 text-primary" />
                    Board Chair
                  </h2>
                  <MemberCard member={chair} />
                </div>
              )}
              
              {/* Board Members */}
              {members.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    Board Members
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {members.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* External Advisors */}
              {externalMembers.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Eye className="w-6 h-6 text-primary" />
                    External Advisors
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {externalMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="governance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Governance Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Oversight Areas</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {governanceStructure.oversightAreas.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Review Frequency</h3>
                      <p className="text-sm text-muted-foreground">
                        {governanceStructure.reviewFrequency}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Decision Making</h3>
                      <p className="text-sm text-muted-foreground">
                        {governanceStructure.decisionMakingProcess}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Conflict Resolution</h3>
                      <p className="text-sm text-muted-foreground">
                        {governanceStructure.conflictResolution}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Data Access</h3>
                      <p className="text-sm text-muted-foreground">
                        {governanceStructure.dataAccessPolicy}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Publication Review</h3>
                    <p className="text-sm text-muted-foreground">
                      {governanceStructure.publicationReview}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">General Inquiries</h4>
                      <a href={`mailto:${contactInfo.general}`} className="text-sm text-primary hover:underline">
                        {contactInfo.general}
                      </a>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Governance Matters</h4>
                      <a href={`mailto:${contactInfo.governance}`} className="text-sm text-primary hover:underline">
                        {contactInfo.governance}
                      </a>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Technical Issues</h4>
                      <a href={`mailto:${contactInfo.technical}`} className="text-sm text-primary hover:underline">
                        {contactInfo.technical}
                      </a>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Media Inquiries</h4>
                      <a href={`mailto:${contactInfo.media}`} className="text-sm text-primary hover:underline">
                        {contactInfo.media}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="principles" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Independence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {platformPrinciples.independence}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Transparency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {platformPrinciples.transparency}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {platformPrinciples.privacy}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {platformPrinciples.accuracy}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {platformPrinciples.accessibility}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Board Decisions & Meeting Minutes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {boardDecisions.map((decision) => (
                      <div key={decision.id} className="border-l-4 border-primary pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{decision.topic}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(decision.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Unanimous
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Decision:</span>
                            <p className="text-muted-foreground mt-1">{decision.decision}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium">Rationale:</span>
                            <p className="text-muted-foreground mt-1">{decision.rationale}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedMember.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedMember.title}</p>
                    <p className="text-sm font-medium">{selectedMember.affiliation}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Biography</h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.bio}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.expertise.map((area, idx) => (
                      <Badge key={idx} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Conflict of Interest Statement</h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.conflictStatement}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Board member since {new Date(selectedMember.memberSince).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </div>
                
                {selectedMember.contact && (
                  <div className="flex items-center gap-2">
                    {selectedMember.contact.email && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${selectedMember.contact.email}`}>
                          <Mail className="w-4 h-4 mr-1" />
                          Email
                        </a>
                      </Button>
                    )}
                    {selectedMember.contact.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://twitter.com/${selectedMember.contact.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                          <Twitter className="w-4 h-4 mr-1" />
                          Twitter
                        </a>
                      </Button>
                    )}
                    {selectedMember.contact.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://linkedin.com/in/${selectedMember.contact.linkedin}`} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4 mr-1" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="relative z-10 border-t border-border mt-16">
          <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Civic Data Platform.</span>
            <span>Governance through independent oversight.</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default AdvisoryBoard;