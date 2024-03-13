# Robot Stacker
A simple stacking game for [supertechft.org](https://supertechft.org/gallery/games/)
Developed by: [Prabhjot "Prince" Singh](https://github.com/Prince25)

## Technologies
- [Phaser](https://phaser.io/)
- JavaScript / HTML / CSS

## Future Plans
- ~~Add pause at the start~~
- Fix completion of level bug.
- Change ground sprite
- Add Sounds
- After game complete:
  - ~~play again~~
  - ~~donation link~~

### Other Notes
Checking Level Completion After Dropping the Next Block:
Instead of checking for level completion immediately after dropping a crate in the dropCrate method, consider introducing a delay or checking for level completion only after all crates have settled. One approach could be to utilize a timed event or check the velocities of all crates; if they're below a certain threshold, it's an indication that the crates have settled.
Checking for the Highest Stacked Block:

The current logic in the update method updates highestCrateHeight every frame. This might incorrectly consider blocks that momentarily touch but then fall. To address this, you could introduce a delay after a collision before updating the highestCrateHeight. Only after the block has remained stationary for a certain duration (indicating it's genuinely stacked) should you update the height.

Further Potential Enhancements:
 - Feedback on Collision: Consider adding sound effects or visual effects when blocks collide. This would provide better feedback to the player.
- Optimization: Regularly destroying and recreating game objects, like the crates, might not be optimal. Consider using Phaser's object pooling to reuse game objects, which can improve performance.
