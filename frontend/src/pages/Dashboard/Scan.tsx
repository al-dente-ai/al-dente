import { useState, useRef } from 'react';
import { useScan, useItems, toast } from '../../store';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import type { CreateItemFormData } from '../../lib/validators';
import { formatDate } from '../../lib/utils';

export default function Scan() {
  const { uploadImage, isSubmitting, lastScanResult, clearResult } = useScan();
  const { create: createItem } = useItems();
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = async (file: File) => {
    console.log('📁 [SCAN COMPONENT] File selected', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      timestamp: new Date().toISOString(),
    });

    if (!file.type.startsWith('image/')) {
      console.warn('⚠️ [SCAN COMPONENT] Invalid file type rejected', file.type);
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      console.warn(
        '⚠️ [SCAN COMPONENT] File too large rejected',
        `${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      toast.error('File size must be less than 16MB');
      return;
    }

    console.log('✅ [SCAN COMPONENT] File validation passed, starting upload');

    try {
      // Actually upload the image and get AI analysis
      const result = await uploadImage(file);
      console.log('🎉 [SCAN COMPONENT] Upload successful, showing preview modal', {
        resultImageUrl: result.image_url,
        predictionName: result.prediction.name,
      });
      setShowPreview(true);
    } catch (error) {
      console.error('❌ [SCAN COMPONENT] Upload failed', error);
      // Error handled by store and displayed via toast
      toast.error('Failed to analyze image. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset drag state
    setDragActive(false);
    setDragCounter(0);

    console.log('📂 [SCAN COMPONENT] Files dropped', {
      fileCount: e.dataTransfer.files.length,
      files: Array.from(e.dataTransfer.files).map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
      timestamp: new Date().toISOString(),
    });

    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      console.log('✅ [SCAN COMPONENT] Processing dropped file', files[0].name);
      handleFileSelect(files[0]);
    } else {
      console.warn('⚠️ [SCAN COMPONENT] No files found in drop event');
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if files are being dragged
    const hasFiles = e.dataTransfer.types.includes('Files');

    setDragCounter((prevCounter) => {
      const newCounter = prevCounter + 1;
      console.log('🔄 [SCAN COMPONENT] Drag enter detected', {
        hasFiles,
        dragCounter: newCounter,
        dataTransferTypes: Array.from(e.dataTransfer.types),
        timestamp: new Date().toISOString(),
      });
      return newCounter;
    });

    if (hasFiles) {
      setDragActive(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if files are being dragged over
    const hasFiles = e.dataTransfer.types.includes('Files');

    // Only log occasionally to avoid spam
    if (Math.random() < 0.01) {
      console.log('📋 [SCAN COMPONENT] Drag over active', { hasFiles });
    }

    // Ensure drag active state is maintained for file drags
    if (hasFiles && !dragActive) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter((prevCounter) => {
      const newCounter = prevCounter - 1;
      console.log('🚪 [SCAN COMPONENT] Drag leave detected', {
        dragCounter: newCounter,
        timestamp: new Date().toISOString(),
      });

      // Only deactivate drag when counter reaches 0 (completely left the drop zone)
      if (newCounter === 0) {
        console.log('🚪 [SCAN COMPONENT] Leaving drop zone completely - deactivating drag');
        setDragActive(false);
      }

      return Math.max(0, newCounter); // Prevent negative counter
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleAddToInventory = async () => {
    if (!lastScanResult?.prediction) {
      console.warn('⚠️ [SCAN COMPONENT] No scan result available for adding to inventory');
      return;
    }

    const itemData: CreateItemFormData = {
      name: lastScanResult.prediction.name,
      amount: lastScanResult.prediction.amount || undefined,
      expiry: lastScanResult.prediction.expiry || undefined,
      categories: lastScanResult.prediction.categories,
      notes: lastScanResult.prediction.notes || undefined,
      image_url: lastScanResult.image_url,
    };

    console.log('📦 [SCAN COMPONENT] Adding item to inventory', {
      itemData,
      timestamp: new Date().toISOString(),
    });

    try {
      await createItem(itemData);
      console.log('✅ [SCAN COMPONENT] Item successfully added to inventory', itemData.name);
      toast.success(`Added "${itemData.name}" to your inventory!`);
      setShowPreview(false);
      clearResult();
    } catch (error) {
      console.error('❌ [SCAN COMPONENT] Failed to add item to inventory', error);
      toast.error('Failed to add item to inventory');
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    clearResult();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan Food Items</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload photos of your food items and let AI identify them automatically.
        </p>
      </div>

      <Card className="text-center">
        <div
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-xl p-12 transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Food Image</h3>
          <p className="text-gray-600 mb-6">
            Drag and drop an image here, or click to select a file
          </p>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            size="lg"
          >
            {isSubmitting ? 'Analyzing...' : 'Choose File'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileInput}
            className="hidden"
          />

          <p className="text-xs text-gray-500 mt-4">Supports PNG, JPEG, JPG, WebP (max 16MB)</p>
        </div>
      </Card>

      {/* Recent scans could go here */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl mb-2">📷</div>
            <h3 className="font-medium text-gray-900">1. Upload</h3>
            <p className="text-sm text-gray-600">
              Take a photo or upload an image of your food items
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-medium text-gray-900">2. Analyze</h3>
            <p className="text-sm text-gray-600">AI identifies the food and suggests details</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">➕</div>
            <h3 className="font-medium text-gray-900">3. Add</h3>
            <p className="text-sm text-gray-600">Review and add to your pantry inventory</p>
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview && !!lastScanResult}
        onClose={handleCancel}
        title="AI Food Recognition Result"
        size="lg"
      >
        {lastScanResult && (
          <div className="space-y-6">
            {/* Image */}
            <div className="text-center">
              <img
                src={lastScanResult.image_url}
                alt="Scanned food"
                className="max-w-full h-48 object-contain mx-auto rounded-lg"
              />
            </div>

            {/* AI Prediction */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                AI Prediction (Confidence: {Math.round(lastScanResult.prediction.confidence * 100)}
                %)
              </h3>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{lastScanResult.prediction.name}</span>
                </div>
                {lastScanResult.prediction.amount && (
                  <div>
                    <span className="font-medium text-gray-700">Amount:</span>
                    <span className="ml-2 text-gray-900">{lastScanResult.prediction.amount}</span>
                  </div>
                )}
                {lastScanResult.prediction.expiry && (
                  <div>
                    <span className="font-medium text-gray-700">Expiry:</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(lastScanResult.prediction.expiry)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Categories:</span>
                  <span className="ml-2 text-gray-900">
                    {lastScanResult.prediction.categories.join(', ')}
                  </span>
                </div>
                {lastScanResult.prediction.notes && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Notes:</span>
                    <span className="ml-2 text-gray-900">{lastScanResult.prediction.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button onClick={handleAddToInventory} className="flex-1">
                Add to Inventory
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
