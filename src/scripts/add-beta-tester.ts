
import { adminService } from "../services/admin";

// This script makes info@rivalproductions.net a beta tester
async function makeBetaTester() {
  try {
    console.log("Attempting to make info@rivalproductions.net a beta tester...");
    
    const result = await adminService.assignRoleByEmail("info@rivalproductions.net", "beta_tester");
    
    if (result) {
      console.log("✅ Successfully assigned beta_tester role to info@rivalproductions.net");
    } else {
      console.error("❌ Failed to assign beta_tester role");
    }
  } catch (error) {
    console.error("Error in makeBetaTester script:", error);
  }
}

// Execute the function
makeBetaTester();
