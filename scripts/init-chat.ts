import { storage } from "../server/storage";

async function initializeChatRooms() {
  console.log("Initializing chat rooms...");

  try {
    // Check if general chat exists
    const existingRooms = await storage.getAllChatRooms();
    const generalChatExists = existingRooms.some(room => room.type === 'general');

    if (!generalChatExists) {
      console.log("Creating general chat room...");
      await storage.createChatRoom({
        name: 'General Discussion',
        type: 'general',
        championshipId: null,
      });
      console.log("✅ General chat room created");
    } else {
      console.log("✅ General chat room already exists");
    }

    // Create chat rooms for existing championships
    const championships = await storage.getAllChampionships();
    
    for (const championship of championships) {
      const chatExists = existingRooms.some(room => room.championshipId === championship.id);
      
      if (!chatExists) {
        console.log(`Creating chat room for ${championship.name}...`);
        await storage.createChatRoom({
          name: `${championship.name} Chat`,
          type: 'championship',
          championshipId: championship.id,
        });
        console.log(`✅ Chat room created for ${championship.name}`);
      } else {
        console.log(`✅ Chat room already exists for ${championship.name}`);
      }
    }

    console.log("🎉 Chat room initialization complete!");
  } catch (error) {
    console.error("❌ Failed to initialize chat rooms:", error);
  }
}

// Run the initialization
initializeChatRooms().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});