import { Hammer } from 'lucide-react';
import Modal from './Modal';

export default function InfoModal({ title, description, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width="sm">
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-brew-orange/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Hammer className="w-6 h-6 text-brew-orange" />
        </div>
        <p className="text-sm text-brew-navy font-medium mb-1">
          Раздел в разработке
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          {description ||
            'Этот раздел появится в следующих версиях. Пока можешь пользоваться планировщиком и командой.'}
        </p>
      </div>
    </Modal>
  );
}