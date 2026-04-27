export type ModalProps = {
  open: boolean;
  title: string;
};

const Modal = (props: ModalProps) => {
    return props.open ? (
        <>
          <div className="bg-blue-300 border border-neutral-700 top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-80 h-48 p-5 flex justify-center absolute">
            <h1 className="text-xl font-bold">{props.title}</h1>
          </div>
        </>
    ) : (
        <></>
    );
}

export default Modal;