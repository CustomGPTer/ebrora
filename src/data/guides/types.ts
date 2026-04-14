// src/data/guides/types.ts
// Self-contained types for the WWTW Design, Safety & Quality Guide

export interface GuideSubsection {
  id: string;
  title: string;
  content: string;
}

export interface GuideSubsystem {
  id: string;
  title: string;
  content: string;
  subsections: GuideSubsection[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  content: string;
  subsystems: GuideSubsystem[];
  directSubsections?: GuideSubsection[];
}

export interface GuideData {
  sections: GuideSection[];
}
