'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, 
  Calendar,
  Building2,
  ShoppingCart,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react'
// import { vpStateMachineService } from '@/services/vp-state-machine-service'

// Mock service for demo purposes
const vpStateMachineService = {
  async createPresentation(data: any) {
    return { id: 'vp_' + Math.random().toString(36).substr(2, 9) }
  },
  async triggerStateTransition(data: any) {
    return { success: true }
  }
}

interface DemoResult {
  vpId: string
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'revoked'
  startTime: Date
  endTime?: Date
  steps: Array<{
    step: string
    status: 'completed' | 'failed' | 'pending'
    timestamp: Date
    details: string
  }>
}

export const RealWorldVPDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('')
  const [demoResults, setDemoResults] = useState<Record<string, DemoResult>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  // University Degree Verification Demo
  const runDegreeVerificationDemo = async () => {
    const demoId = 'degree-verification'
    setActiveDemo(demoId)
    setIsRunning(true)
    setProgress(0)

    const result: DemoResult = {
      vpId: '',
      status: 'pending',
      startTime: new Date(),
      steps: []
    }

    try {
      // Step 1: Create VP with university credentials
      result.steps.push({
        step: 'Creating VP with university degree',
        status: 'pending',
        timestamp: new Date(),
        details: 'Student: Nguyễn Văn A, HCMUS Computer Science degree'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))
      setProgress(20)

      await new Promise(resolve => setTimeout(resolve, 1000))

      const degreeCredentials = {
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
        issuer: 'did:vbsn:university:hcmus',
        credentialSubject: {
          id: 'did:vbsn:student:nguyen-van-a',
          degree: {
            type: 'Bachelor of Science',
            field: 'Computer Science',
            gpa: 3.75,
            graduationDate: '2024-06-15',
            honors: 'Magna Cum Laude'
          },
          university: {
            name: 'Ho Chi Minh City University of Science',
            country: 'Vietnam',
            accreditation: 'MOET-ACCREDITED-2024'
          }
        },
        issuanceDate: '2024-06-15T10:00:00Z',
        expirationDate: '2034-06-15T10:00:00Z'
      }

      const degreeVP = await vpStateMachineService.createPresentation({
        credentials: [degreeCredentials],
        holder: 'did:vbsn:student:nguyen-van-a',
        type: 'academic_verification',
        purpose: 'degree_verification_for_employment',
        metadata: {
          use_case: 'university_degree_verification',
          requester: 'tech_company_hr',
          verification_level: 'full_academic_record'
        }
      })

      result.vpId = degreeVP.id
      result.steps[0].status = 'completed'
      result.steps[0].details += ` | VP ID: ${degreeVP.id.slice(0, 8)}...`
      setProgress(40)

      // Step 2: Submit to employer
      result.steps.push({
        step: 'Submitting to employer for verification',
        status: 'pending',
        timestamp: new Date(),
        details: 'Employer: Tech Company HR, Position: Senior Software Engineer'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))

      await new Promise(resolve => setTimeout(resolve, 1000))

      await vpStateMachineService.triggerStateTransition({
        presentationId: degreeVP.id,
        newState: 'submitted',
        actor: 'did:vbsn:student:nguyen-van-a',
        metadata: {
          submitted_to: 'did:vbsn:employer:tech-company',
          submission_purpose: 'job_application_verification',
          job_position: 'Senior Software Engineer',
          salary_range: '2000-3000_USD'
        }
      })

      result.status = 'submitted'
      result.steps[1].status = 'completed'
      setProgress(60)

      // Step 3: Employer verification
      result.steps.push({
        step: 'Employer verification process',
        status: 'pending',
        timestamp: new Date(),
        details: 'Checking university accreditation, degree authenticity, GPA verification'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))

      await new Promise(resolve => setTimeout(resolve, 2000))

      const verificationChecks = {
        university_accreditation: true,
        degree_authenticity: true,
        graduation_date: true,
        gpa_verification: true,
        field_relevance: true
      }

      const allChecksPass = Object.values(verificationChecks).every(check => check)

      if (allChecksPass) {
        await vpStateMachineService.triggerStateTransition({
          presentationId: degreeVP.id,
          newState: 'verified',
          actor: 'did:vbsn:employer:tech-company',
          metadata: {
            verification_result: 'APPROVED',
            verification_checks: verificationChecks,
            verifier_notes: 'Excellent academic record, degree verified with university',
            next_steps: 'Proceed to technical interview'
          }
        })

        result.status = 'verified'
        result.steps[2].status = 'completed'
        result.steps[2].details += ' | ✅ All checks passed - APPROVED for interview'
      }

      result.endTime = new Date()
      setProgress(100)

    } catch (error) {
      console.error('Degree verification demo failed:', error)
      result.steps[result.steps.length - 1].status = 'failed'
      result.status = 'rejected'
    }

    setDemoResults(prev => ({ ...prev, [demoId]: result }))
    setIsRunning(false)
  }

  // Age Verification Demo
  const runAgeVerificationDemo = async () => {
    const demoId = 'age-verification'
    setActiveDemo(demoId)
    setIsRunning(true)
    setProgress(0)

    const result: DemoResult = {
      vpId: '',
      status: 'pending',
      startTime: new Date(),
      steps: []
    }

    try {
      // Step 1: Create VP with government ID
      result.steps.push({
        step: 'Creating VP with government ID',
        status: 'pending',
        timestamp: new Date(),
        details: 'User: Lê Văn C, DOB: 1995-03-20 (Age: 30)'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))
      setProgress(20)

      await new Promise(resolve => setTimeout(resolve, 1000))

      const governmentIDCredential = {
        type: ['VerifiableCredential', 'GovernmentIDCredential'],
        issuer: 'did:vbsn:government:vietnam:mps',
        credentialSubject: {
          id: 'did:vbsn:citizen:le-van-c',
          personalInfo: {
            fullName: 'Lê Văn C',
            dateOfBirth: '1995-03-20',
            placeOfBirth: 'Hồ Chí Minh',
            nationality: 'Vietnamese',
            gender: 'Male'
          },
          document: {
            type: 'National ID Card',
            number: '079095001234',
            issueDate: '2020-03-20',
            expiryDate: '2030-03-20'
          }
        }
      }

      const ageVP = await vpStateMachineService.createPresentation({
        credentials: [governmentIDCredential],
        holder: 'did:vbsn:citizen:le-van-c',
        type: 'age_verification',
        purpose: 'online_service_access',
        metadata: {
          use_case: 'age_verification_18_plus',
          service_type: 'cryptocurrency_exchange'
        }
      })

      // Calculate age
      const dateOfBirth = new Date(governmentIDCredential.credentialSubject.personalInfo.dateOfBirth)
      const age = Math.floor((new Date().getTime() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

      result.vpId = ageVP.id
      result.steps[0].status = 'completed'
      result.steps[0].details += ` | Calculated Age: ${age} years`
      setProgress(40)

      // Step 2: Submit to crypto exchange
      result.steps.push({
        step: 'Submitting to cryptocurrency exchange',
        status: 'pending',
        timestamp: new Date(),
        details: 'Service: Binance Vietnam, KYC Level 2 verification'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))

      await new Promise(resolve => setTimeout(resolve, 1000))

      await vpStateMachineService.triggerStateTransition({
        presentationId: ageVP.id,
        newState: 'submitted',
        actor: 'did:vbsn:citizen:le-van-c',
        metadata: {
          submitted_to: 'did:vbsn:service:binance-vietnam',
          service_type: 'cryptocurrency_trading',
          kyc_level: 'level_2_verification'
        }
      })

      result.status = 'submitted'
      result.steps[1].status = 'completed'
      setProgress(60)

      // Step 3: Age verification
      result.steps.push({
        step: 'Age verification process',
        status: 'pending',
        timestamp: new Date(),
        details: `Checking age requirement (≥18). User age: ${age} years`
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))

      await new Promise(resolve => setTimeout(resolve, 1500))

      const ageRequirementMet = age >= 18
      const verificationChecks = {
        government_id_authenticity: true,
        age_calculation: ageRequirementMet,
        document_validity: true,
        identity_matching: true,
        sanctions_check: true
      }

      const allChecksPass = Object.values(verificationChecks).every(check => check)

      if (allChecksPass && ageRequirementMet) {
        await vpStateMachineService.triggerStateTransition({
          presentationId: ageVP.id,
          newState: 'verified',
          actor: 'did:vbsn:service:binance-vietnam',
          metadata: {
            verification_result: 'APPROVED',
            age_verified: true,
            calculated_age: age,
            account_status: 'ACTIVATED',
            trading_limits: {
              daily_limit: '100000_USD',
              monthly_limit: '1000000_USD'
            }
          }
        })

        result.status = 'verified'
        result.steps[2].status = 'completed'
        result.steps[2].details += ` | ✅ Age requirement met - Account activated`
      } else {
        result.status = 'rejected'
        result.steps[2].status = 'failed'
        result.steps[2].details += ` | ❌ Age requirement not met`
      }

      result.endTime = new Date()
      setProgress(100)

    } catch (error) {
      console.error('Age verification demo failed:', error)
      result.steps[result.steps.length - 1].status = 'failed'
      result.status = 'rejected'
    }

    setDemoResults(prev => ({ ...prev, [demoId]: result }))
    setIsRunning(false)
  }

  // Professional License Verification Demo
  const runProfessionalLicenseDemo = async () => {
    const demoId = 'professional-license'
    setActiveDemo(demoId)
    setIsRunning(true)
    setProgress(0)

    const result: DemoResult = {
      vpId: '',
      status: 'pending',
      startTime: new Date(),
      steps: []
    }

    try {
      // Step 1: Create VP with medical license
      result.steps.push({
        step: 'Creating VP with medical license',
        status: 'pending',
        timestamp: new Date(),
        details: 'Doctor: Dr. Nguyễn Thị Mai, Medical License: MD-HCM-2020-001'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))
      setProgress(25)

      await new Promise(resolve => setTimeout(resolve, 1000))

      const medicalLicenseCredential = {
        type: ['VerifiableCredential', 'ProfessionalLicenseCredential'],
        issuer: 'did:vbsn:government:vietnam:health',
        credentialSubject: {
          id: 'did:vbsn:doctor:nguyen-thi-mai',
          professionalInfo: {
            fullName: 'Dr. Nguyễn Thị Mai',
            licenseNumber: 'MD-HCM-2020-001',
            specialty: 'Cardiology',
            yearsOfExperience: 15,
            education: 'MD from University of Medicine HCM City'
          },
          license: {
            type: 'Medical Practice License',
            issueDate: '2020-01-15',
            expiryDate: '2025-01-15',
            issuingAuthority: 'Vietnam Ministry of Health',
            status: 'active'
          }
        }
      }

      const licenseVP = await vpStateMachineService.createPresentation({
        credentials: [medicalLicenseCredential],
        holder: 'did:vbsn:doctor:nguyen-thi-mai',
        type: 'professional_verification',
        purpose: 'hospital_employment',
        metadata: {
          use_case: 'medical_license_verification',
          position: 'Senior Cardiologist',
          hospital: 'Cho Ray Hospital'
        }
      })

      result.vpId = licenseVP.id
      result.steps[0].status = 'completed'
      setProgress(50)

      // Step 2: Submit to hospital
      result.steps.push({
        step: 'Submitting to hospital HR',
        status: 'pending',
        timestamp: new Date(),
        details: 'Hospital: Cho Ray Hospital, Position: Senior Cardiologist'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))

      await new Promise(resolve => setTimeout(resolve, 1000))

      await vpStateMachineService.triggerStateTransition({
        presentationId: licenseVP.id,
        newState: 'submitted',
        actor: 'did:vbsn:doctor:nguyen-thi-mai',
        metadata: {
          submitted_to: 'did:vbsn:hospital:cho-ray',
          position: 'Senior Cardiologist',
          department: 'Cardiology',
          employment_type: 'full_time'
        }
      })

      result.status = 'submitted'
      result.steps[1].status = 'completed'
      setProgress(75)

      // Step 3: Hospital verification
      result.steps.push({
        step: 'Hospital license verification',
        status: 'pending',
        timestamp: new Date(),
        details: 'Verifying with Ministry of Health database and medical board'
      })
      setDemoResults(prev => ({ ...prev, [demoId]: result }))

      await new Promise(resolve => setTimeout(resolve, 2000))

      const licenseVerificationChecks = {
        license_authenticity: true,
        ministry_database_check: true,
        license_status: true,
        specialty_verification: true,
        disciplinary_record: true
      }

      const allChecksPass = Object.values(licenseVerificationChecks).every(check => check)

      if (allChecksPass) {
        await vpStateMachineService.triggerStateTransition({
          presentationId: licenseVP.id,
          newState: 'verified',
          actor: 'did:vbsn:hospital:cho-ray',
          metadata: {
            verification_result: 'APPROVED',
            license_verified: true,
            verification_checks: licenseVerificationChecks,
            employment_status: 'APPROVED',
            start_date: '2025-08-01',
            salary_grade: 'Senior_Level_3'
          }
        })

        result.status = 'verified'
        result.steps[2].status = 'completed'
        result.steps[2].details += ' | ✅ License verified - Employment approved'
      }

      result.endTime = new Date()
      setProgress(100)

    } catch (error) {
      console.error('Professional license demo failed:', error)
      result.steps[result.steps.length - 1].status = 'failed'
      result.status = 'rejected'
    }

    setDemoResults(prev => ({ ...prev, [demoId]: result }))
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      submitted: 'secondary',
      verified: 'default',
      rejected: 'destructive',
      revoked: 'outline'
    } as const

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      revoked: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🌏 Real-World VP State Machine Demos
        </h1>
        <p className="text-gray-600">
          Các trường hợp thực tế: Xác thực văn bằng, tuổi tác, giấy phép nghề nghiệp
        </p>
      </div>

      <Tabs defaultValue="degree" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="degree" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Xác Thực Văn Bằng
          </TabsTrigger>
          <TabsTrigger value="age" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Xác Thực Tuổi &gt;18
          </TabsTrigger>
          <TabsTrigger value="license" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Giấy Phép Nghề Nghiệp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="degree" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                University Degree Verification Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Scenario:</strong> Sinh viên Nguyễn Văn A (HCMUS Computer Science) 
                  nộp hồ sơ xin việc tại công ty công nghệ. HR cần xác thực bằng cấp.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button 
                  onClick={runDegreeVerificationDemo}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  {isRunning && activeDemo === 'degree-verification' ? 'Running...' : 'Run Degree Verification Demo'}
                </Button>
                
                {activeDemo === 'degree-verification' && (
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="w-32" />
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                )}
              </div>

              {demoResults['degree-verification'] && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">VP Status:</span>
                    {getStatusBadge(demoResults['degree-verification'].status)}
                  </div>
                  
                  <div className="space-y-2">
                    {demoResults['degree-verification'].steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border">
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">{step.step}</div>
                          <div className="text-sm text-gray-600">{step.details}</div>
                          <div className="text-xs text-gray-400">
                            {step.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {demoResults['degree-verification'].endTime && (
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      ⏱️ Total Duration: {
                        Math.round((demoResults['degree-verification'].endTime.getTime() - 
                        demoResults['degree-verification'].startTime.getTime()) / 1000)
                      } seconds
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Age Verification Demo (&gt;18 years)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Scenario:</strong> User Lê Văn C (30 tuổi) muốn đăng ký tài khoản 
                  cryptocurrency exchange, cần xác thực tuổi ≥18 với CMND/CCCD.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button 
                  onClick={runAgeVerificationDemo}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {isRunning && activeDemo === 'age-verification' ? 'Running...' : 'Run Age Verification Demo'}
                </Button>
                
                {activeDemo === 'age-verification' && (
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="w-32" />
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                )}
              </div>

              {demoResults['age-verification'] && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">VP Status:</span>
                    {getStatusBadge(demoResults['age-verification'].status)}
                  </div>
                  
                  <div className="space-y-2">
                    {demoResults['age-verification'].steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border">
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">{step.step}</div>
                          <div className="text-sm text-gray-600">{step.details}</div>
                          <div className="text-xs text-gray-400">
                            {step.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {demoResults['age-verification'].endTime && (
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      ⏱️ Total Duration: {
                        Math.round((demoResults['age-verification'].endTime.getTime() - 
                        demoResults['age-verification'].startTime.getTime()) / 1000)
                      } seconds
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="license" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Professional License Verification Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Scenario:</strong> Bác sĩ Nguyễn Thị Mai (chuyên khoa Tim mạch) 
                  xin việc tại Bệnh viện Chợ Rẫy. Cần xác thực giấy phép hành nghề y.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button 
                  onClick={runProfessionalLicenseDemo}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {isRunning && activeDemo === 'professional-license' ? 'Running...' : 'Run License Verification Demo'}
                </Button>
                
                {activeDemo === 'professional-license' && (
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="w-32" />
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                )}
              </div>

              {demoResults['professional-license'] && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">VP Status:</span>
                    {getStatusBadge(demoResults['professional-license'].status)}
                  </div>
                  
                  <div className="space-y-2">
                    {demoResults['professional-license'].steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border">
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">{step.step}</div>
                          <div className="text-sm text-gray-600">{step.details}</div>
                          <div className="text-xs text-gray-400">
                            {step.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {demoResults['professional-license'].endTime && (
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      ⏱️ Total Duration: {
                        Math.round((demoResults['professional-license'].endTime.getTime() - 
                        demoResults['professional-license'].startTime.getTime()) / 1000)
                      } seconds
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Demo Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Xác Thực Văn Bằng
              </h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Sinh viên tạo VP với credentials từ trường đại học</li>
                <li>• Submit đến HR công ty để xác thực</li>
                <li>• HR verify với database của trường</li>
                <li>• Approve/Reject dựa trên kết quả verification</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Xác Thực Tuổi &gt;18
              </h4>
              <ul className="text-gray-600 space-y-1">
                <li>• User tạo VP với CMND/CCCD</li>
                <li>• Submit đến service provider (crypto exchange)</li>
                <li>• System tính tuổi từ ngày sinh</li>
                <li>• Approve nếu ≥18, Reject nếu &lt;18</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Giấy Phép Nghề Nghiệp
              </h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Bác sĩ tạo VP với giấy phép hành nghề</li>
                <li>• Submit đến bệnh viện</li>
                <li>• Verify với database Bộ Y tế</li>
                <li>• Check tính hợp lệ và trạng thái license</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RealWorldVPDemo
