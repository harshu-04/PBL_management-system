const GlobalSettings = require('../models/GlobalSettings');

const getActivePhase = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();
    console.log(`[PHASE] Fetch request. Current in DB: ${settings?.currentPhase}`);
    
    // Auto-initialize if missing
    if (!settings) {
      console.log('[PHASE] Settings missing, initializing...');
      settings = await GlobalSettings.create({ currentPhase: 1, completedPhases: [] });
    }
    
    res.json({ activePhase: settings.currentPhase, completedPhases: settings.completedPhases });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const setActivePhase = async (req, res) => {
  try {
    const { activePhase } = req.body; // Requested phase
    console.log(`[PHASE] Update request to: ${activePhase}`);

    if (![1, 2, 3].includes(activePhase)) {
      return res.status(400).json({ message: 'Invalid phase. Must be 1, 2, or 3.' });
    }

    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({ currentPhase: 1, completedPhases: [] });
    }

    // Set new phase directly (Removed strict sequential blocks as requested)
    settings.currentPhase = activePhase;
    
    // Automatically manage completedPhases for UI/History: anything less than activePhase is completed
    settings.completedPhases = [];
    for (let i = 1; i < activePhase; i++) {
        settings.completedPhases.push(i);
    }
    
    await settings.save();
    console.log(`[PHASE] Successfully updated DB to phase ${settings.currentPhase}. Completed: ${settings.completedPhases}`);
    
    res.json({ 
      message: `Successfully set current phase to ${activePhase}`, 
      activePhase: settings.currentPhase,
      completedPhases: settings.completedPhases 
    });
  } catch (err) {
    console.error(`[PHASE] Update error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getActivePhase, setActivePhase };
