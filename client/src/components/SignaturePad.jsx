import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

const SignaturePad = ({ onSave, initialSignature = null }) => {
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current.clear();
    setIsEmpty(true);
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
      alert('กรุณาเซ็นชื่อก่อนบันทึก');
      return;
    }
    const dataURL = sigCanvas.current.toDataURL();
    onSave(dataURL);
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="space-y-4">
      <div className="border-4 border-dashed border-green-300 rounded-xl bg-white p-4">
        <p className="text-center text-gray-600 mb-3 font-bold text-lg">
          ✍️ เซ็นชื่อด้วยเมาส์หรือนิ้วในกรอบด้านล่าง
        </p>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'w-full h-48 cursor-crosshair',
              style: { touchAction: 'none' }
            }}
            backgroundColor="white"
            penColor="black"
            minWidth={1}
            maxWidth={3}
            onBegin={handleBegin}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={clear}
          className="flex-1 py-3 px-4 bg-red-100 text-red-700 font-bold text-lg rounded-xl hover:bg-red-200 transition flex items-center justify-center border-2 border-red-300"
        >
          <TrashIcon className="w-5 h-5 mr-2" />
          ล้างลายเซ็น
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isEmpty}
          className="flex-1 py-3 px-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
        >
          <CheckIcon className="w-5 h-5 mr-2" />
          บันทึกลายเซ็น
        </button>
      </div>

      {initialSignature && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 mb-2 font-bold">ลายเซ็นปัจจุบัน:</p>
          <img src={initialSignature} alt="Current Signature" className="w-full h-24 object-contain bg-white border border-gray-300 rounded" />
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
