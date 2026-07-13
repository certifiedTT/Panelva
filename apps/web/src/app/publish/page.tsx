"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  Image as ImageIcon, 
  Compass, 
  Edit3, 
  AlertTriangle, 
  Tag, 
  Eye, 
  UploadCloud, 
  CheckCircle,
  HelpCircle,
  ChevronRight
} from "lucide-react";

const STEPS = [
  { id: "step-1", label: "Step 1: Create Episode & Title", icon: <BookOpen size={16} /> },
  { id: "step-2", label: "Step 2: Schedule Date", icon: <Calendar size={16} /> },
  { id: "step-3", label: "Step 3: Add Files", icon: <UploadCloud size={16} /> },
  { id: "step-4", label: "Step 4: Add Thumbnails", icon: <ImageIcon size={16} /> },
  { id: "step-5", label: "Step 5: Add Description", icon: <Edit3 size={16} /> },
  { id: "step-6", label: "Step 6: Mature Filter & Comments", icon: <AlertTriangle size={16} /> },
  { id: "step-7", label: "Step 7: Episode Tags", icon: <Tag size={16} /> },
  { id: "step-8", label: "Step 8: Live Preview", icon: <Eye size={16} /> },
  { id: "step-9", label: "Step 9: Publish or Schedule", icon: <CheckCircle size={16} /> },
  { id: "after-pub", label: "After Publishing", icon: <Compass size={16} /> },
  { id: "done", label: "Done!", icon: <CheckCircle size={16} /> },
  { id: "more", label: "Want to learn more?", icon: <HelpCircle size={16} /> }
];

export default function PublishGuidePage() {
  const [activeId, setActiveId] = useState<string>("step-1");

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      for (const step of STEPS) {
        const el = document.getElementById(step.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(step.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth"
      });
      setActiveId(id);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090c", color: "#ffffff", fontFamily: "var(--font-sans)", paddingBottom: "5rem" }}>
      {/* Back Header Banner */}
      <div style={{ borderBottom: "1px solid var(--border-color, #1c1e24)", background: "rgba(13, 14, 18, 0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 90 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-muted-color, #8a8d98)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted-color)"}>
            <ArrowLeft size={16} /> Back to Panelva
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
        
        {/* Title Header */}
        <div style={{ marginBottom: "3.5rem" }}>
          <span style={{ fontSize: "0.75rem", background: "rgba(37, 99, 235, 0.15)", color: "#3b82f6", padding: "4px 12px", borderRadius: "9999px", fontWeight: 700, textTransform: "uppercase" }}>
            Publishing Guide
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 850, margin: "12px 0", letterSpacing: "-0.02em" }}>
            Creating a COMIC Episode
          </h1>
          <p style={{ color: "var(--text-muted-color, #8a8d98)", fontSize: "1.1rem", maxWidth: "800px", lineHeight: 1.6 }}>
            Panelva is an innovative platform for storytellers. Through our sophisticated Creator Dashboard, you have the ability to publish your own comics or novels, monitor your daily performance metrics, and generate revenue from your creative efforts.
            Creating a webcomic is hard work, so we've made uploading episodes as simple and convenient as possible!
          </p>
        </div>

        {/* Content & Sidebar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "3.5rem", alignItems: "start" }} className="guide-layout-grid">
          
          {/* Sidebar Navigation (Page Structure Map) */}
          <aside style={{ position: "sticky", top: "100px", display: "flex", flexDirection: "column", gap: "1.5rem" }} className="guide-sidebar">
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-muted-color)", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "12px" }}>
              Page Structure Map
            </div>
            
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* Vertical connecting line */}
              <div style={{ position: "absolute", left: "21px", top: "12px", bottom: "12px", width: "2px", background: "linear-gradient(to bottom, #2563eb 0%, rgba(37, 99, 235, 0.1) 100%)", zIndex: 1 }} />
              
              {STEPS.map((step) => {
                const isActive = activeId === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => scrollToSection(step.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "none",
                      border: "none",
                      color: isActive ? "#ffffff" : "var(--text-muted-color, #8a8d98)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 700 : 500,
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.2s",
                      zIndex: 2,
                      transform: isActive ? "translateX(4px)" : "none"
                    }}
                  >
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: isActive ? "#2563eb" : "var(--panel-color, #0d0e12)",
                      border: `2px solid ${isActive ? "#3b82f6" : "var(--border-color, #1c1e24)"}`,
                      color: isActive ? "#fff" : "var(--text-muted-color)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: "0.7rem",
                      transition: "all 0.2s",
                      flexShrink: 0
                    }}>
                      {step.icon}
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Guide Steps Panel */}
          <main style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Step 1 */}
            <section id="step-1" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <BookOpen size={20} />
                <span>STEP 1</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Create an Episode and Title</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.92rem", margin: "0 0 1rem 0" }}>
                Go to your dashboard and locate the series you want to add an episode to. Click the **Add Episode** button (represented by a green plus sign <span style={{ color: "#10b981", fontWeight: "bold" }}>+</span>) to create a new episode.
              </p>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border-color)", padding: "1rem", borderRadius: "8px", fontSize: "0.85rem", color: "var(--text-muted-color)" }}>
                <strong>Title Entry:</strong> Enter your episode’s title in the corresponding field. Keep it engaging and representative of the chapter contents!
              </div>
            </section>

            {/* Step 2 */}
            <section id="step-2" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <Calendar size={20} />
                <span>STEP 2</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Schedule Date</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.92rem", margin: 0 }}>
                Choose the exact date and time you want your episode to release. You can publish immediately or configure a future publication slot. Panelva will take care of releasing it automatically on the selected schedule.
              </p>
            </section>

            {/* Step 3 */}
            <section id="step-3" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <UploadCloud size={20} />
                <span>STEP 3</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Add Files</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.92rem", margin: "0 0 1.5rem 0" }}>
                Add your comic files using the **Upload Files** button. Make sure your artwork follows our Content Guidelines!
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }} className="upload-requirements-grid">
                <div style={{ padding: "1.2rem", background: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.2)", borderRadius: "10px" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#3b82f6", textTransform: "uppercase", marginBottom: "0.5rem" }}>Standard Files</div>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.82rem", color: "var(--text-muted-color)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <li><strong>Width:</strong> 940 px</li>
                    <li><strong>Height:</strong> No height limit</li>
                    <li><strong>Formats:</strong> PNG, JPG, or GIF</li>
                    <li><strong>Size Limit:</strong> 10MB per file</li>
                  </ul>
                </div>

                <div style={{ padding: "1.2rem", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "10px" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#f59e0b", textTransform: "uppercase", marginBottom: "0.5rem" }}>GIF Exceptions</div>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted-color)", lineHeight: 1.5 }}>
                    If an image is in <strong>GIF format</strong>, a strict height limit of <strong>maximum 1000px</strong> applies to protect rendering performance.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(0,0,0,0.2)", padding: "1.2rem", borderRadius: "10px", fontSize: "0.82rem", color: "var(--text-muted-color)", border: "1px solid var(--border-color)" }}>
                <div>• Hover over your file name to see a file preview.</div>
                <div>• If a file does not match the specifications, a validation message will highlight the size or format discrepancy.</div>
                <div>• Reorganize file ordering via drag and drop using the reorder handle.</div>
                <div>• Delete a single file by clicking the trash bin icon on the right, or empty all files at once using the master trash icon at the header.</div>
              </div>
            </section>

            {/* Step 4 */}
            <section id="step-4" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <ImageIcon size={20} />
                <span>STEP 4</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Add Thumbnails</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 750, margin: "0 0 0.5rem 0", color: "#ffffff" }}>Episode Thumbnail</h3>
                  <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>
                    Shown in your episode list, helping readers distinguish episodes visually. Most creators crop a key panel from the episode itself. This artwork must be safe for all ages.
                  </p>
                  <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted-color)" }}>
                    Specs: 300 x 300 px | PNG, JPG, or GIF | Under 2 MB
                  </span>
                </div>

                <div style={{ height: "1px", backgroundColor: "var(--border-color)" }}></div>

                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 750, margin: "0 0 0.5rem 0", color: "#ffffff" }}>Share Thumbnail</h3>
                  <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.9rem", margin: "0 0 0.8rem 0" }}>
                    Appears alongside link previews when sharing individual episode links on social media channels.
                  </p>
                  <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.5, fontSize: "0.85rem", margin: 0 }}>
                    You can adjust the focus region by clicking on the preview image and sliding the orange selection crop box. Flip through pages using the side selection arrows. Click <strong>Use This</strong> to finalize.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 5 */}
            <section id="step-5" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <Edit3 size={20} />
                <span>STEP 5</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Add a Description (Optional)</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.92rem", margin: 0 }}>
                Write author notes that will appear directly below the published episode. You can use this area to connect with your community, share background stories, ask questions, or link your social handles. This is entirely optional.
              </p>
            </section>

            {/* Step 6 */}
            <section id="step-6" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <AlertTriangle size={20} />
                <span>STEP 6</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.2rem 0" }}>Mature Content and Comments</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 750, margin: "0 0 0.5rem 0", color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={16} /> Mature Content Filter
                  </h3>
                  <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.9rem", margin: 0 }}>
                    If your episode contains sexual themes, nudity, abuse, violence, or excessive gore/blood, you must toggle the <strong>Mature</strong> filter. Select all tags that apply. Use responsible judgement to prevent content flagging.
                  </p>
                </div>

                <div style={{ height: "1px", backgroundColor: "var(--border-color)" }}></div>

                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 750, margin: "0 0 0.5rem 0", color: "#ffffff" }}>Comment Toggles</h3>
                  <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.9rem", margin: 0 }}>
                    By default, episodes are open for comments. You can choose to turn comments off globally for the episode through the provided toggle.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 7 */}
            <section id="step-7" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <Tag size={20} />
                <span>STEP 7</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Tags</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.92rem", margin: "0 0 1rem 0" }}>
                You may add up to <strong>10 tags</strong> to your episode. Press enter after each keyword to lock it. Delete them by clicking the small <strong>X</strong> on the tag bubble.
              </p>
              <div style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.82rem", color: "var(--text-muted-color)" }}>
                Note: Episode tags appear below your Author notes box. They do not feed global search filters, but are used by creators to append fun trivia, bonus labels, or extra details for readers.
              </div>
            </section>

            {/* Step 8 */}
            <section id="step-8" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <Eye size={20} />
                <span>STEP 8</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Preview</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.92rem", margin: 0 }}>
                Click the <strong>Preview</strong> button in the top right corner. It launches your episode in a mockup reading view (desktop and mobile viewports) so you can verify that text is legible and panels slice correctly before committing.
              </p>
            </section>

            {/* Step 9 */}
            <section id="step-9" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <CheckCircle size={20} />
                <span>STEP 9</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.2rem 0" }}>Draft, Schedule, or Publish</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 750, margin: "0 0 0.5rem 0", color: "#ffffff" }}>Auto-Draft Saving</h3>
                  <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.95rem", margin: 0 }}>
                    Episodes are saved as drafts. Ensure the <strong>Draft Saved</strong> banner appears in the top right corner before closing or navigating away from the creator dashboard.
                  </p>
                </div>

                <div style={{ height: "1px", backgroundColor: "var(--border-color)" }}></div>

                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 750, margin: "0 0 0.5rem 0", color: "#10b981" }}>Publishing Actions</h3>
                  <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.9rem", margin: 0 }}>
                    Clicking <strong>Publish</strong> releases the episode immediately. Clicking <strong>Schedule</strong> reserves publication until the target datetime configured in Step 2.
                  </p>
                </div>
              </div>
            </section>

            {/* After Publishing */}
            <section id="after-pub" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <Compass size={20} />
                <span>AFTER PUBLISHING</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.2rem 0" }}>After Publishing Your Episode</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", fontSize: "0.9rem", color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6 }}>
                <div>
                  • You can continue to edit published episodes or drag-and-drop to reorder them via the <strong>Episodes</strong> tab.
                </div>
                <div>
                  • Once readers begin leaving comments, filter unresolved ones easily via the <strong>Unanswered Comments</strong> filter.
                </div>
                <div>
                  • Highlight your favorite responses by clicking the <strong>Pin Icon</strong> next to a comment to place it at the very top of the feed.
                </div>
              </div>
            </section>

            {/* Done */}
            <section id="done" className="glass-panel" style={{ padding: "2.5rem 2rem", border: "1px solid #10b981", borderRadius: "16px", background: "linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(0,0,0,0) 100%)", textAlign: "center" }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: "0 auto 1rem auto" }} />
              <h2 style={{ fontSize: "1.8rem", fontWeight: 850, margin: "0 0 0.5rem 0", color: "#fff" }}>Done!</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto 1.5rem auto" }}>
                Your first episode is up, well done! While you're working on your upcoming episodes, learn how to find your audience or how to select the right genre for your series.
              </p>
              <button onClick={() => scrollToSection("step-1")} style={{ background: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: 700, cursor: "pointer", transition: "filter 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.15)"} onMouseLeave={(e) => e.currentTarget.style.filter = "none"}>
                Back to Top
              </button>
            </section>

            {/* Want to learn more? */}
            <section id="more" className="glass-panel" style={{ padding: "2rem", border: "1px solid var(--border-color, #1c1e24)", borderRadius: "16px", backgroundColor: "var(--panel-color, #0d0e12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontWeight: 700, marginBottom: "1rem" }}>
                <HelpCircle size={20} />
                <span>SUPPORT</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Want to learn more?</h2>
              <p style={{ color: "var(--text-muted-color, #a1a1aa)", lineHeight: 1.6, fontSize: "0.92rem", margin: "0 0 1.5rem 0" }}>
                Join our inaugural wave of independent creators today. Check out our other tutorials for new creators, including metadata configuration and viewer retention tips!
              </p>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <Link href="/help" style={{ textDecoration: "none", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }} className="hover:bg-white/10 transition">
                  Help Center
                </Link>
                <Link href="/community" style={{ textDecoration: "none", color: "#3b82f6", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }} className="hover:underline">
                  Creator Forums <ChevronRight size={14} />
                </Link>
              </div>
            </section>

          </main>

        </div>

      </div>
    </div>
  );
}
