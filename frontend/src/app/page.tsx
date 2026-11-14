'use client';

import React, { useState, useEffect } from 'react';
import { Project, Source, Claim, LeaverQuestion } from '@/lib/types';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { WorkflowStepper, StepKey } from '@/components/WorkflowStepper';
import { ConnectSourcesTab } from '@/components/ConnectSourcesTab';
import { ReconstructVerifyTab } from '@/components/ReconstructVerifyTab';
import { QuestionsForLeaverTab } from '@/components/QuestionsForLeaverTab';
import { ReviewGateTab } from '@/components/ReviewGateTab';
import { HandoverViewTab } from '@/components/HandoverViewTab';
import { EvidenceViewerModal } from '@/components/EvidenceViewerModal';
import { AuditLogModal } from '@/components/AuditLogModal';
import {
  Sparkles,
  PlusCircle,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState<StepKey>('connect');
  const [sources, setSources] = useState<Source[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [questions, setQuestions] = useState<LeaverQuestion[]>([]);
  const [selectedClaimForEvidence, setSelectedClaimForEvidence] = useState<Claim | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newTargetRole, setNewTargetRole] = useState('Backend Lead');
  const [newLeavingMember, setNewLeavingMember] = useState('Alex Rivera (Outgoing Lead)');
  const [newIncomingMember, setNewIncomingMember] = useState('Sam Chen (Incoming Successor)');
  const [newReviewerName, setNewReviewerName] = useState('Priya Sharma (Tech Lead / Reviewer)');

  // Load initial projects
  const refreshProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0 && !activeProject) {
        setActiveProject(list[0]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  // When activeProject changes, load its sources, claims, questions
  const loadProjectData = async (projId: string) => {
    try {
      const [srcs, clms, qsts, updatedProj] = await Promise.all([
        api.getSources(projId),
        api.getClaims(projId),
        api.getQuestions(projId),
        api.getProject(projId),
      ]);
      setSources(Array.isArray(srcs) ? srcs : []);
      setClaims(Array.isArray(clms) ? clms : []);
      setQuestions(Array.isArray(qsts) ? qsts : []);
      if (updatedProj && typeof updatedProj === 'object' && 'id' in updatedProj) {
        setActiveProject(updatedProj);
      }
    } catch (err) {
      console.error('Error loading project data:', err);
    }
  };

  useEffect(() => {
    if (activeProject?.id) {
      loadProjectData(activeProject.id);
    }
  }, [activeProject?.id]);

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await api.loadEventsAppDemo();
      await refreshProjects();
      const demoProj = await api.getProject(res.project_id);
      setActiveProject(demoProj);
      setCurrentStep('reconstruct');
    } catch (err) {
      console.error('Error loading demo:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleReconstruct = async () => {
    if (!activeProject) return;
    setReconstructing(true);
    try {
      await api.reconstruct(activeProject.id);
      await loadProjectData(activeProject.id);
      setCurrentStep('reconstruct');
    } catch (err) {
      console.error('Error during reconstruction:', err);
    } finally {
      setReconstructing(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const created = await api.createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        target_role: newTargetRole,
        leaving_member: newLeavingMember,
        incoming_member: newIncomingMember,
        reviewer_name: newReviewerName,
      });
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      await refreshProjects();
      setActiveProject(created);
      setCurrentStep('connect');
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const unansweredCount = Array.isArray(questions)
    ? questions.filter((q) => !q.is_answered).length
    : 0;
  const isApproved = activeProject?.status === 'Approved' || activeProject?.status === 'HandedOver';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        project={activeProject}
        onOpenAudit={() => setShowAuditModal(true)}
        onLoadDemo={handleLoadDemo}
        onNewProject={() => setShowNewProjectModal(true)}
        loadingDemo={loadingDemo}
      />

      {/* Main Container */}
      {!activeProject && !loading ? (
        /* Zero State / Quickstart Splash */
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-xl">
            <div className="w-8 h-8 relative flex flex-col justify-center items-center gap-2 rotate-[-35deg]">
              <span className="w-8 h-2 rounded-full bg-amber-400 block shadow-sm shadow-amber-500/50"></span>
              <span className="w-6 h-2 rounded-full bg-teal-400 block shadow-sm shadow-teal-500/50 ml-1"></span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Knowledge handover that shows its evidence
          </h1>
          <p className="text-base text-slate-300 max-w-xl leading-relaxed mb-8">
            When people leave, the reasoning leaves with them. Baton turns scattered project activity
            (docs, git repo, task boards, chat exports) into a reviewed, role-appropriate handover.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleLoadDemo}
              disabled={loadingDemo}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loadingDemo ? 'Loading Demo Scenario...' : 'Load Events App Demo Scenario'}</span>
            </button>

            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition"
            >
              <PlusCircle className="w-4 h-4 text-teal-400" />
              <span>Create Empty Handover</span>
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left w-full">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <span className="text-teal-400 font-bold text-xs uppercase tracking-wider block mb-1">
                Evidence First
              </span>
              <h3 className="text-sm font-bold text-white mb-1">Verifiable Claims</h3>
              <p className="text-xs text-slate-400">
                Every claim links back to its exact supporting chunk. Marked Verified, Inferred, Conflicting, or Missing.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">
                Gaps Become Questions
              </span>
              <h3 className="text-sm font-bold text-white mb-1">Leaver Q&A</h3>
              <p className="text-xs text-slate-400">
                Missing facts or disagreements become targeted questions for the leaver to answer before they leave.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-1">
                Review Gate & Roles
              </span>
              <h3 className="text-sm font-bold text-white mb-1">Access-Aware Views</h3>
              <p className="text-xs text-slate-400">
                Nothing shared until approved by a reviewer. Tailored role-based views for Successor, Teammate, Manager.
              </p>
            </div>
          </div>
        </main>
      ) : activeProject ? (
        <main className="flex-1 flex flex-col">
          {/* 5-Stage Stepper */}
          <WorkflowStepper
            currentStep={currentStep}
            onSelectStep={setCurrentStep}
            unansweredQuestionsCount={unansweredCount}
            isApproved={isApproved}
          />

          {/* Active Tab View */}
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentStep === 'connect' && (
              <ConnectSourcesTab
                project={activeProject}
                sources={sources}
                onSourcesUpdated={() => loadProjectData(activeProject.id)}
                onProceedToReconstruct={() => handleReconstruct()}
              />
            )}

            {currentStep === 'reconstruct' && (
              <ReconstructVerifyTab
                claims={claims}
                onReconstruct={handleReconstruct}
                reconstructing={reconstructing}
                onSelectClaim={setSelectedClaimForEvidence}
                onProceedToQuestions={() => setCurrentStep('questions')}
              />
            )}

            {currentStep === 'questions' && (
              <QuestionsForLeaverTab
                project={activeProject}
                questions={questions}
                onQuestionsUpdated={() => loadProjectData(activeProject.id)}
                onProceedToReview={() => setCurrentStep('review')}
              />
            )}

            {currentStep === 'review' && (
              <ReviewGateTab
                project={activeProject}
                claims={claims}
                onReviewCompleted={() => loadProjectData(activeProject.id)}
                onSelectClaim={setSelectedClaimForEvidence}
                onProceedToHandover={() => setCurrentStep('handover')}
              />
            )}

            {currentStep === 'handover' && (
              <HandoverViewTab
                projectId={activeProject.id}
                onSelectClaim={setSelectedClaimForEvidence}
                onReceiptSigned={() => loadProjectData(activeProject.id)}
              />
            )}
          </div>
        </main>
      ) : null}

      {/* Evidence Viewer Drawer/Modal */}
      <EvidenceViewerModal
        claim={selectedClaimForEvidence}
        onClose={() => setSelectedClaimForEvidence(null)}
      />

      {/* Audit Log Modal */}
      {activeProject && (
        <AuditLogModal
          projectId={activeProject.id}
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {/* New Handover Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Create New Handover Project</h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App Backend"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Context and goal of this project handover..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={newTargetRole}
                    onChange={(e) => setNewTargetRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Reviewer Name
                  </label>
                  <input
                    type="text"
                    value={newReviewerName}
                    onChange={(e) => setNewReviewerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Leaving Member
                  </label>
                  <input
                    type="text"
                    value={newLeavingMember}
                    onChange={(e) => setNewLeavingMember(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Incoming Member
                  </label>
                  <input
                    type="text"
                    value={newIncomingMember}
                    onChange={(e) => setNewIncomingMember(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs"
                >
                  Create Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
