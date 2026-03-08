import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const fitItems = [
    'Length',
    'Chest',
    'Waist',
    'Shoulder width',
    'Sleeve length',
    'Hip circumference',
    'High hip',
    'Front rise',
    'Back rise',
    'Neckline depth',
    'Neckline width',
    'Bicep width',
    'Cuff opening',
    'Leg opening',
    'Inseam',
    'Outseam',
    'Across back',
    'Across chest',
    'Chest width',
    'Waist width',
    'Hip width',
    'Total length (Center back)',
    'Neck opening',
    'Drape',
    'Balance',
    'Ease of movement',
    'Lining ease',
    'Symmetry',
    'Tension lines',
    'Point of strain',
    'Shoulder placement',
    'Hem levelness'
];
const workItems = [
    'Stitch placement',
    'Stitch distance',
    'Thread thickness',
    'Button attachment',
    'Thread tension',
    'Buttonhole',
    'Thread trimming',
    'Seam alignment',
    'Pattern matching',
    'Hem finish',
    'Lining attachment',
    'Zipper functionality',
    'Interfacing quality',
    'Pressing quality',
    'Label positioning',
    'Overlock neatness',
    'Hook and eye security',
    'Snap fastener strength',
    'Shoulder pad stability',
    'Embroidery tension'
];

async function cleanup() {
    const { data: samples, error } = await supabase.from('samples').select('id, internal_notes');
    if (error) {
        console.error('Error fetching samples:', error);
        return;
    }

    let modifiedCount = 0;

    for (const sample of samples) {
        if (!sample.internal_notes) continue;

        try {
            const parsed = JSON.parse(sample.internal_notes);
            if (!parsed._isJsonBlob) continue;

            let modified = true;

            // Strict cleanup of fitChecks to empty or only string properties of default items
            if (parsed.fitChecks) {
                for (const key of Object.keys(parsed.fitChecks)) {
                    if (!fitItems.includes(key)) {
                        delete parsed.fitChecks[key];
                    }
                }
            }
            if (parsed.workChecks) {
                for (const key of Object.keys(parsed.workChecks)) {
                    if (!workItems.includes(key)) {
                        delete parsed.workChecks[key];
                    }
                }
            }

            // Purge also out of hidden items
            if (Array.isArray(parsed.hiddenFitItems)) {
                parsed.hiddenFitItems = parsed.hiddenFitItems.filter(item => fitItems.includes(item));
            }
            if (Array.isArray(parsed.hiddenWorkItems)) {
                parsed.hiddenWorkItems = parsed.hiddenWorkItems.filter(item => workItems.includes(item));
            }

            if (modified) {
                await supabase.from('samples').update({
                    internal_notes: JSON.stringify(parsed)
                }).eq('id', sample.id);
                modifiedCount++;
                console.log(`Force cleaned up sample ${sample.id}`);
            }
        } catch (e) {
            // Not JSON or other error
        }
    }

    console.log(`Force cleanup complete. Modified ${modifiedCount} samples.`);
}

cleanup();
