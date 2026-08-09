"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, KeyRound, Save, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { Field, Input } from "@/components/ui/forms";
import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { useAuth, type User } from "@/lib/auth";
import { API_URL, apiRequest, getErrorMessage } from "@/lib/api/client";

type ProfileForm = {
  name: string;
  phone: string;
};

type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

function avatarSource(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function initials(name?: string): string {
  return (name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AccountSettings() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileForm>({ name: "", phone: "" });
  const [passwords, setPasswords] = useState<PasswordForm>({ current: "", next: "", confirm: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({ name: user.name || "", phone: user.phone_number || "" });
    setAvatarPreview(avatarSource(user.avatar_url));
  }, [user]);

  const roleLabel = useMemo(() => {
    if (user?.role === "admin") return "Quản trị viên";
    if (user?.role === "teacher") return "Giáo viên";
    return "Học sinh";
  }, [user?.role]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile.name.trim()) {
      toast.error("Họ và tên không được để trống.");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await apiRequest<User>("/api/auth/users/me", {
        method: "PUT",
        body: JSON.stringify({ name: profile.name.trim(), phone: profile.phone.trim() || null }),
      });
      updateUser(updated);
      toast.success("Đã cập nhật thông tin cá nhân.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật thông tin cá nhân."));
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      toast.error("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiRequest<{ avatar_url: string }>("/api/auth/users/me/avatar", {
        method: "POST",
        body: formData,
      });
      const updated = { ...user, avatar_url: result.avatar_url };
      updateUser(updated);
      setAvatarPreview(avatarSource(result.avatar_url));
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải ảnh đại diện."));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (passwords.next.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    setChangingPassword(true);
    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.next }),
      });
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Đã đổi mật khẩu.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đổi mật khẩu."));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cài đặt tài khoản"
        description="Quản lý thông tin cá nhân, ảnh đại diện và bảo mật đăng nhập trong một nơi."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Surface className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center">
            <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-xl font-extrabold text-brand-strong">
              {avatarPreview ? (
                <Image src={avatarPreview} alt={`Ảnh đại diện của ${user?.name || "người dùng"}`} fill unoptimized className="object-cover" />
              ) : (
                initials(user?.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-ink">{user?.name || "Tài khoản"}</p>
              <p className="mt-1 truncate text-sm text-ink-soft">{user?.email}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-brand">{roleLabel}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={uploadAvatar}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
              <Camera className="size-4" />
              {uploadingAvatar ? "Đang tải..." : "Đổi ảnh"}
            </Button>
          </div>

          <form className="grid gap-5" onSubmit={saveProfile}>
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-brand" />
              <h2 className="text-lg font-extrabold text-ink">Thông tin cá nhân</h2>
            </div>
            <Field label="Họ và tên" name="account-name" required>
              <Input
                value={profile.name}
                autoComplete="name"
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Email đăng nhập" name="account-email" helper="Liên hệ quản trị viên nếu cần đổi email đăng nhập.">
              <Input value={user?.email || ""} type="email" readOnly disabled />
            </Field>
            <Field label="Số điện thoại" name="account-phone" helper="Không bắt buộc.">
              <Input
                value={profile.phone}
                type="tel"
                autoComplete="tel"
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                <Save className="size-4" />
                {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            </div>
          </form>
        </Surface>

        <Surface className="p-5 sm:p-6">
          <form className="grid gap-5" onSubmit={changePassword}>
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-brand" />
                <h2 className="text-lg font-extrabold text-ink">Đổi mật khẩu</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-soft">Dùng ít nhất 8 ký tự và không chia sẻ mật khẩu với người khác.</p>
            </div>
            <Field label="Mật khẩu hiện tại" name="current-password" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={passwords.current}
                onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
              />
            </Field>
            <Field label="Mật khẩu mới" name="new-password" required>
              <Input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwords.next}
                onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
              />
            </Field>
            <Field label="Xác nhận mật khẩu mới" name="confirm-password" required>
              <Input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwords.confirm}
                onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
              />
            </Field>
            <Button type="submit" disabled={changingPassword} className="w-full">
              <KeyRound className="size-4" />
              {changingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        </Surface>
      </div>
    </div>
  );
}
