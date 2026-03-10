/**
 * InstallGuide — step-by-step PWA install instructions.
 *
 * /interaction-design: stagger entrance for steps, numbered badges.
 * /mobile-ios-design: visual cues matching iOS share sheet.
 * /mobile-android-design: references Chrome install banner.
 *
 * Shows the guide matching the user's detected OS + browser.
 * Each step has a numbered badge, text, and optional hint.
 */

import { motion } from 'motion/react';
import { Monitor, Smartphone } from 'lucide-react';
import type { InstallGuideData } from '@/data/install-guides';

interface InstallGuideProps {
  readonly guide: InstallGuideData;
}

/** Map icon string key to Lucide component */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Smartphone,
  Monitor,
};

export function InstallGuide({ guide }: InstallGuideProps) {
  const IconComponent = ICON_MAP[guide.icon] ?? Smartphone;

  return (
    <div className="w-full max-w-md">
      {/* Guide header */}
      <motion.div
        className="mb-6 flex items-center gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-brand/10">
          <IconComponent className="h-5 w-5 text-cyan-brand" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {guide.title}
        </h3>
      </motion.div>

      {/* Steps list */}
      <ol className="flex flex-col gap-4">
        {guide.steps.map((step, index) => (
          <motion.li
            key={index}
            className="flex gap-4"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.1 + index * 0.08 }}
          >
            {/* Step number badge */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-brand/15 text-sm font-bold text-cyan-brand"
              style={{ minWidth: 32, minHeight: 32 }}
            >
              {index + 1}
            </div>

            {/* Step content */}
            <div className="flex flex-col gap-1 pt-0.5">
              <p className="text-base leading-relaxed text-foreground">
                {step.text}
              </p>
              {step.hint != null && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.hint}
                </p>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
