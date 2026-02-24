'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usefetch } from '@/lib/hooks/usefetch'
import { useauth } from '@/lib/authcontext'
import { apicall } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FerrisWheel, Check, ArrowRight, Users, Loader2 } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import type { user, organizer } from '@/lib/types'
import { AppLayout } from '@/components/layouts/applayout'

const INTERESTS = [
  'Technology', 'Music', 'Art', 'Sports', 'Gaming',
  'Photography', 'Dance', 'Literature', 'Science', 'Business',
  'Design', 'Film', 'Robotics', 'Quiz', 'Dramatics',
]

export default function OnboardingPage() {
  const router = useRouter()
  const { token, user } = useauth()
  const [step, setStep] = useState(1)
  
  // Step 1 State: Interests
  const { data: profile } = usefetch<user>('/api/users/me')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [savingInterests, setSavingInterests] = useState(false)

  // Step 2 State: Organizers
  const { data: organizers, loading: loadingOrgs } = usefetch<organizer[]>('/api/organizers', { skip: step !== 2 })
  const [following, setFollowing] = useState<string[]>([])
  const [processingFollow, setProcessingFollow] = useState<string | null>(null)

  // Initialize following state from profile
  useEffect(() => {
    if (profile?.following) {
      const followedIds = profile.following.map(f => typeof f === 'string' ? f : f._id)
      setFollowing(followedIds)
    }
  }, [profile])


  // --- Step 1 Handlers ---

  const toggleInterest = (interest: string) => {
    setSelectedInterests(current => 
      current.includes(interest) 
        ? current.filter(i => i !== interest)
        : [...current, interest]
    )
  }

  const handleInterestsNext = async () => {
    setSavingInterests(true)
    try {
      await apicall('/api/users/me', { 
        method: 'PATCH', 
        body: { interests: selectedInterests }, 
        token 
      })
      setStep(2)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingInterests(false)
    }
  }

  const handleInterestsSkip = () => {
    setStep(2)
  }


  // --- Step 2 Handlers ---

  const handleToggleFollow = async (orgId: string) => {
    if (processingFollow) return
    setProcessingFollow(orgId)
    
    // Optimistic update
    const isFollowing = following.includes(orgId)
    setFollowing(prev => isFollowing ? prev.filter(id => id !== orgId) : [...prev, orgId])

    try {
      await apicall(`/api/organizers/${orgId}/follow`, { method: 'POST', token })
    } catch (e) {
      // Revert if failed
      setFollowing(prev => isFollowing ? [...prev, orgId] : prev.filter(id => id !== orgId))
      console.error(e)
    } finally {
      setProcessingFollow(null)
    }
  }

  const handleFinish = () => {
    router.push('/dashboard')
  }

  return (
    <AppLayout roles={['Participant']}>
      <div className="bg-dark flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center gap-3 font-semibold text-xl">
              <div className="flex size-8 items-center justify-center rounded-md">
                <FerrisWheel className="size-6" />
              </div>
              Felicity
            </a>
            <ModeToggle />
          </div>

          <Card className="bg-card/50 border-muted/60 shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl">
                {step === 1 ? 'Pick your interests' : 'Follow Clubs'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Select topics you enjoy to personlize your feed.' 
                  : 'Follow clubs to get notified about their events.'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {step === 1 ? (
                // STEP 1: INTERESTS
                <>
                  <div className="flex flex-wrap gap-2 justify-center py-4 min-h-[200px] content-start">
                    {INTERESTS.map(interest => {
                      const isSelected = selectedInterests.includes(interest)
                      return (
                        <Badge
                          key={interest}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer text-sm py-1.5 px-3 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                          {isSelected && <Check className="h-3 w-3 ml-1.5" />}
                        </Badge>
                      )
                    })}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button onClick={handleInterestsNext} disabled={savingInterests} className="w-full">
                      {savingInterests ? 'Saving...' : 'Next'}
                      {!savingInterests && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                    <Button variant="ghost" onClick={handleInterestsSkip} disabled={savingInterests} className="w-full">
                      Skip
                    </Button>
                  </div>
                </>
              ) : (
                // STEP 2: CLUBS
                <>
                  <ScrollArea className="h-[300px] pr-4 -mr-4">
                    {loadingOrgs ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm">Loading clubs...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {organizers?.map(org => {
                          const isFollowed = following.includes(org._id)
                          return (
                            <div key={org._id} className="flex items-center justify-between p-3 rounded-lg border bg-background/40 hover:bg-background/60 transition-colors">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar className="h-10 w-10 border bg-muted">
                                  <AvatarFallback>{org.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{org.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{org.category}</div>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant={isFollowed ? "secondary" : "outline"}
                                className={isFollowed ? "hover:bg-destructive/10 hover:text-destructive" : ""}
                                onClick={() => handleToggleFollow(org._id)}
                                disabled={processingFollow === org._id}
                              >
                                {isFollowed ? 'Following' : 'Follow'}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="flex flex-col gap-3 pt-2">
                    <Button onClick={handleFinish} className="w-full">
                      Finish
                      <Check className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
