import os
import numpy as np
from PIL import Image

def process_stickers():
    img_path = "frontend/public/images/stickers.jpg.png"
    if not os.path.exists(img_path):
        print(f"Error: {img_path} not found.")
        return

    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    
    # Non-white pixels mask
    # White is > 240 in all RGB channels
    mask = ~((arr[:,:,0] > 240) & (arr[:,:,1] > 240) & (arr[:,:,2] > 240))
    
    # Project to X and Y axes to find gaps
    x_proj = mask.sum(axis=0)
    y_proj = mask.sum(axis=1)
    
    # Find splits by looking for regions where projection is 0 or very small
    def find_splits(proj, num_splits=2):
        # We want to find `num_splits` large gaps. 
        # A simple way: find all zero/low regions, then pick the largest gaps.
        # But we know there are 3 items, so we need 2 splits.
        # Let's smooth the projection slightly
        window = 10
        smoothed = np.convolve(proj, np.ones(window)/window, mode='same')
        
        # Find points where smoothed < threshold
        threshold = smoothed.max() * 0.05
        low_points = np.where(smoothed < threshold)[0]
        
        # Group consecutive low points
        gaps = []
        if len(low_points) > 0:
            current_gap = [low_points[0]]
            for p in low_points[1:]:
                if p == current_gap[-1] + 1:
                    current_gap.append(p)
                else:
                    gaps.append(current_gap)
                    current_gap = [p]
            gaps.append(current_gap)
        
        # Filter gaps that are at the very edges
        gaps = [g for g in gaps if g[0] > len(proj)*0.1 and g[-1] < len(proj)*0.9]
        
        # Get the two largest gaps
        gaps.sort(key=len, reverse=True)
        gaps = gaps[:num_splits]
        
        # Return the centers of these gaps
        splits = [g[len(g)//2] for g in gaps]
        splits.sort()
        return splits

    x_splits = find_splits(x_proj, 2)
    y_splits = find_splits(y_proj, 2)
    
    x_bounds = [0] + x_splits + [arr.shape[1]]
    y_bounds = [0] + y_splits + [arr.shape[0]]
    
    out_dir = "frontend/public/images/stickers"
    os.makedirs(out_dir, exist_ok=True)
    
    index = 1
    for i in range(3):
        for j in range(3):
            left, right = x_bounds[j], x_bounds[j+1]
            top, bottom = y_bounds[i], y_bounds[i+1]
            
            # Extract cell
            cell = img.crop((left, top, right, bottom))
            
            # Make white transparent
            data = cell.getdata()
            new_data = []
            for item in data:
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            cell.putdata(new_data)
            
            # Crop to bounding box
            bbox = cell.getbbox()
            if bbox:
                cell = cell.crop(bbox)
                
            cell.save(f"{out_dir}/sticker_{index}.png", "PNG")
            print(f"Saved sticker_{index}.png")
            index += 1

    print("All stickers processed successfully with smart cropping!")

if __name__ == "__main__":
    process_stickers()
